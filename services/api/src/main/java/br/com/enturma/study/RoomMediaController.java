package br.com.enturma.study;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.AppChanged;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/study-rooms/{id}/media/{kind}")
public class RoomMediaController {
  private final Db db;
  private final StudyService study;
  private final ApplicationEventPublisher events;

  public RoomMediaController(Db db, StudyService study, ApplicationEventPublisher events) {
    this.db = db;
    this.study = study;
    this.events = events;
  }

  private String kind(String kind) {
    if (!Set.of("avatar", "banner").contains(kind)) throw ApiException.invalid("Imagem inválida.");
    return kind;
  }

  @GetMapping
  public ResponseEntity<byte[]> read(
      @AuthenticationPrincipal Actor actor, @PathVariable UUID id, @PathVariable String kind) {
    // These images are room discovery artwork. Private messages/materials remain member-only.
    var image =
        db.one("SELECT mime,data FROM room_media WHERE room_id=? AND kind=?", id, kind(kind));
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType((String) image.get("mime")))
        .header("Cache-Control", "private,max-age=300")
        .header("X-Content-Type-Options", "nosniff")
        .body((byte[]) image.get("data"));
  }

  @PostMapping
  @Transactional
  public void upload(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID id,
      @PathVariable String kind,
      @RequestParam MultipartFile file)
      throws IOException {
    kind(kind);
    var room = study.activeLocked(id);
    if (!room.get("hostId").equals(actor.id())) throw ApiException.forbidden();
    if (file.isEmpty() || file.getSize() > 3 * 1024 * 1024)
      throw ApiException.invalid("Use uma imagem de até 3 MB.");
    byte[] data = file.getBytes();
    String mime = file.getContentType();
    if (!validImage(mime, data))
      throw ApiException.invalid("Use um arquivo PNG, JPG, GIF ou WEBP válido.");
    db.jdbc.update(
        "INSERT INTO room_media(room_id,kind,mime,data) VALUES (?,?,?,?) ON CONFLICT(room_id,kind)"
            + " DO UPDATE SET mime=excluded.mime,data=excluded.data",
        id,
        kind,
        mime,
        data);
    update(id, kind, true);
  }

  @DeleteMapping
  @Transactional
  public void remove(
      @AuthenticationPrincipal Actor actor, @PathVariable UUID id, @PathVariable String kind) {
    kind(kind);
    if (!study.activeLocked(id).get("hostId").equals(actor.id())) throw ApiException.forbidden();
    db.jdbc.update("DELETE FROM room_media WHERE room_id=? AND kind=?", id, kind);
    update(id, kind, false);
  }

  private void update(UUID id, String kind, boolean exists) {
    db.jdbc.update(
        "UPDATE study_room SET has_" + kind + "=?,media_version=media_version+1 WHERE id=?",
        exists,
        id);
    events.publishEvent(new AppChanged("rooms_changed", Set.of()));
  }

  public static boolean validImage(String mime, byte[] data) {
    if (mime == null || data.length < 12) return false;
    String start = new String(data, 0, 12, StandardCharsets.ISO_8859_1);
    return switch (mime) {
      case "image/png" ->
          Arrays.equals(
              Arrays.copyOf(data, 8), new byte[] {(byte) 137, 80, 78, 71, 13, 10, 26, 10});
      case "image/jpeg" -> data[0] == (byte) 255 && data[1] == (byte) 216 && data[2] == (byte) 255;
      case "image/gif" -> start.startsWith("GIF87a") || start.startsWith("GIF89a");
      case "image/webp" -> start.startsWith("RIFF") && start.substring(8).equals("WEBP");
      default -> false;
    };
  }
}
