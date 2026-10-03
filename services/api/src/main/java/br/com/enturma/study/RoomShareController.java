package br.com.enturma.study;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms")
public class RoomShareController {
  private final Db db;
  private final StudyService study;
  private final String appUrl;
  private final SecureRandom random = new SecureRandom();

  public RoomShareController(
      Db db,
      StudyService study,
      @Value("$" + "{enturma.app-url}") String appUrl) {
    this.db = db;
    this.study = study;
    this.appUrl = appUrl.replaceAll("/+$", "");
  }

  @PostMapping("/{id}/share-code")
  public Object code(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.member(a, id);
    String code = ensureCode(id);
    return Map.of("code", code, "url", appUrl + "/join/" + code);
  }

  @GetMapping("/{id}/qr")
  public ResponseEntity<byte[]> qr(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id) throws Exception {
    study.member(a, id);
    String code = ensureCode(id);
    var matrix =
        new QRCodeWriter().encode(appUrl + "/join/" + code, BarcodeFormat.QR_CODE, 33, 33);
    int scale = 8;
    int size = matrix.getWidth() * scale;
    var svg =
        new StringBuilder(
            "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 "
                + size
                + " "
                + size
                + "' shape-rendering='crispEdges'><rect width='100%' height='100%' fill='white'/><path d='");
    for (int y = 0; y < matrix.getHeight(); y++) {
      for (int x = 0; x < matrix.getWidth(); x++) {
        if (matrix.get(x, y))
          svg.append("M")
              .append(x * scale)
              .append(" ")
              .append(y * scale)
              .append("h")
              .append(scale)
              .append("v")
              .append(scale)
              .append("h-")
              .append(scale)
              .append("z");
      }
    }
    svg.append("' fill='#183f36'/></svg>");
    return ResponseEntity.ok()
        .contentType(MediaType.valueOf("image/svg+xml"))
        .body(svg.toString().getBytes(StandardCharsets.UTF_8));
  }

  @GetMapping("/join-code/{code}")
  public Object resolve(
      @AuthenticationPrincipal Actor a, @PathVariable String code) {
    return db.one(
        "SELECT r.id,r.title,r.status,r.ends_at,s.name subject_name"
            + " FROM study_room r JOIN academic_entry s ON s.id=r.subject_id"
            + " WHERE upper(r.share_code)=upper(?)",
        code.strip());
  }

  @PostMapping("/join-code/{code}/join")
  public Object join(
      @AuthenticationPrincipal Actor a, @PathVariable String code) {
    UUID id =
        (UUID)
            db.one(
                    "SELECT id FROM study_room WHERE upper(share_code)=upper(?)",
                    code.strip())
                .get("id");
    study.join(a, id);
    return study.detail(a, id);
  }

  private String ensureCode(UUID id) {
    var row = db.one("SELECT share_code FROM study_room WHERE id=?", id);
    String existing = Objects.toString(row.get("shareCode"), "");
    if (!existing.isBlank()) return existing;

    for (int attempt = 0; attempt < 12; attempt++) {
      String generated = randomCode();
      try {
        int changed =
            db.jdbc.update(
                "UPDATE study_room SET share_code=? WHERE id=? AND share_code IS NULL",
                generated,
                id);
        if (changed == 1) return generated;
        return Objects.toString(
            db.one("SELECT share_code FROM study_room WHERE id=?", id).get("shareCode"));
      } catch (org.springframework.dao.DuplicateKeyException ignored) {
        // Gere outro código raro em caso de colisão.
      }
    }
    throw new IllegalStateException("Não foi possível gerar o código da sala.");
  }

  private String randomCode() {
    String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var b = new StringBuilder();
    for (int i = 0; i < 8; i++)
      b.append(alphabet.charAt(random.nextInt(alphabet.length())));
    return b.toString();
  }
}
