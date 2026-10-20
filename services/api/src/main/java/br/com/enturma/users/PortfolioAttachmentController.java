package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
public class PortfolioAttachmentController {
  private final Db db;

  public PortfolioAttachmentController(Db db) {
    this.db = db;
  }

  @PostMapping("/portfolio/me/assets")
  @Transactional
  public Object upload(@AuthenticationPrincipal Actor actor, @RequestParam MultipartFile file)
      throws IOException {
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", actor.id());
    if (file.isEmpty() || file.getSize() > 3 * 1024 * 1024)
      throw ApiException.invalid("Envie imagens ou PDFs de até 3 MB.");
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM portfolio_attachment WHERE user_id=?", Integer.class, actor.id())
        >= 30)
      throw ApiException.invalid(
          "Seu portfólio pode ter até 30 arquivos. Remova um arquivo antes de enviar outro.");
    byte[] data = file.getBytes();
    String mime =
        Set.of("image/png", "image/jpeg", "image/gif", "image/webp").stream()
            .filter(m -> br.com.enturma.study.RoomMediaController.validImage(m, data))
            .findFirst()
            .orElse(
                data.length >= 5
                        && new String(data, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")
                    ? "application/pdf"
                    : "application/octet-stream");
    if (!Set.of("image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf")
        .contains(mime)) throw ApiException.invalid("Use PNG, JPG, WEBP, GIF ou PDF.");
    UUID id = UUID.randomUUID();
    String name =
        Objects.toString(file.getOriginalFilename(), "arquivo")
            .replaceAll("[\\p{Cntrl}/\\\\]", "_");
    if (name.length() > 180) name = name.substring(name.length() - 180);
    db.jdbc.update(
        "INSERT INTO portfolio_attachment(id,user_id,name,mime,data) VALUES (?,?,?,?,?)",
        id,
        actor.id(),
        name,
        mime,
        data);
    return Map.of("id", id, "name", name, "mime", mime);
  }

  @GetMapping("/portfolio/me/assets/{id}")
  public ResponseEntity<byte[]> own(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    return response(
        db.one(
            "SELECT name,mime,data FROM portfolio_attachment WHERE id=? AND user_id=?",
            id,
            actor.id()));
  }

  @GetMapping("/public/portfolio/assets/{id}")
  public ResponseEntity<byte[]> published(@PathVariable UUID id) {
    return response(
        db.one(
            "SELECT a.name,a.mime,a.data FROM portfolio_attachment a JOIN portfolio_profile p ON"
                + " p.user_id=a.user_id JOIN app_user u ON u.id=a.user_id WHERE a.id=? AND p.public"
                + " AND u.status='ACTIVE' AND EXISTS(SELECT 1 FROM jsonb_array_elements(p.projects)"
                + " project WHERE project->'assets' @> ?::jsonb)",
            id,
            "[\"" + id + "\"]"));
  }

  @DeleteMapping("/portfolio/me/assets/{id}")
  public void remove(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    db.jdbc.update("DELETE FROM portfolio_attachment WHERE id=? AND user_id=?", id, actor.id());
  }

  @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 3600000)
  public void clean() {
    db.jdbc.update(
        "DELETE FROM portfolio_attachment a WHERE a.created_at<now()-interval '24 hours' AND NOT"
            + " EXISTS(SELECT 1 FROM portfolio_profile p,jsonb_array_elements(p.projects) project"
            + " WHERE p.user_id=a.user_id AND project->'assets' @> jsonb_build_array(a.id::text))");
  }

  private ResponseEntity<byte[]> response(Map<String, Object> row) {
    String mime = (String) row.get("mime");
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(mime))
        .header("Cache-Control", "private,no-store")
        .header("X-Content-Type-Options", "nosniff")
        .header("Content-Security-Policy", "sandbox")
        .header(
            "Content-Disposition",
            (mime.startsWith("image/")
                    ? ContentDisposition.inline()
                    : ContentDisposition.attachment())
                .filename((String) row.get("name"), StandardCharsets.UTF_8)
                .build()
                .toString())
        .body((byte[]) row.get("data"));
  }
}
