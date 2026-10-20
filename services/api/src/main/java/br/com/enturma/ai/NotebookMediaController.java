package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.RoomMediaController;
import java.io.IOException;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/notebooks/{id}/media/{kind}")
public class NotebookMediaController {
  private final Db db;
  private final NotebookService notebooks;

  public NotebookMediaController(Db db, NotebookService notebooks) {
    this.db = db;
    this.notebooks = notebooks;
  }

  private String kind(String kind) {
    if (!Set.of("avatar", "banner").contains(kind)) throw ApiException.invalid("Imagem inválida.");
    return kind;
  }

  @GetMapping
  public ResponseEntity<byte[]> read(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable String kind) {
    notebooks.owner(a, id);
    var image =
        db.one(
            "SELECT mime,data FROM notebook_media WHERE notebook_id=? AND kind=?", id, kind(kind));
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType((String) image.get("mime")))
        .header("Cache-Control", "private,no-store")
        .header("X-Content-Type-Options", "nosniff")
        .body((byte[]) image.get("data"));
  }

  @PostMapping
  @Transactional
  public void upload(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @PathVariable String kind,
      @RequestParam MultipartFile file)
      throws IOException {
    notebooks.owner(a, id);
    kind(kind);
    if (file.isEmpty() || file.getSize() > 3 * 1024 * 1024)
      throw ApiException.invalid("Use uma imagem de até 3 MB.");
    byte[] bytes = file.getBytes();
    if (!RoomMediaController.validImage(file.getContentType(), bytes))
      throw ApiException.invalid("Use PNG, JPG, GIF ou WEBP válido.");
    db.jdbc.update(
        "INSERT INTO notebook_media(notebook_id,kind,mime,data) VALUES (?,?,?,?) ON"
            + " CONFLICT(notebook_id,kind) DO UPDATE SET mime=excluded.mime,data=excluded.data",
        id,
        kind,
        file.getContentType(),
        bytes);
    update(id, kind, true);
  }

  @DeleteMapping
  @Transactional
  public void remove(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable String kind) {
    notebooks.owner(a, id);
    db.jdbc.update("DELETE FROM notebook_media WHERE notebook_id=? AND kind=?", id, kind(kind));
    update(id, kind, false);
  }

  private void update(UUID id, String kind, boolean exists) {
    db.jdbc.update(
        "UPDATE study_notebook SET has_"
            + kind
            + "=?,media_version=media_version+1,updated_at=now() WHERE id=?",
        exists,
        id);
  }
}
