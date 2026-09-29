package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/catalog")
public class CatalogSourcesController {
  private final AcademicHttpClient http;
  private final AcademicDocumentParser parser;
  private final Db db;

  public CatalogSourcesController(AcademicHttpClient http, AcademicDocumentParser parser, Db db) {
    this.http = http;
    this.parser = parser;
    this.db = db;
  }

  public record SourceRequest(@NotBlank @Size(max = 2000) String url) {}

  @PostMapping("/documents/inspect")
  public Object inspect(@Valid @RequestBody SourceRequest input) throws Exception {
    var file = http.download(input.url());
    return parser.parse(file.bytes(), file.finalUrl());
  }

  @PostMapping(value = "/documents/pdf", consumes = "multipart/form-data")
  public Object pdf(@RequestParam MultipartFile file, @RequestParam String source)
      throws Exception {
    AcademicHttpClient.validate(source);
    if (file.getSize() > 8 * 1024 * 1024) throw ApiException.invalid("PDF excede 8 MB.");
    return parser.parse(file.getBytes(), source);
  }

  @PostMapping("/sources/{id}/check")
  public Object check(@AuthenticationPrincipal Actor actor, @PathVariable UUID id)
      throws Exception {
    var source = db.one("SELECT * FROM academic_source WHERE id=?", id);
    var file = http.download((String) source.get("sourceUrl"));
    String hash =
        HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(file.bytes()));
    boolean changed = !Objects.equals(hash, source.get("contentHash"));
    db.jdbc.update(
        "UPDATE academic_source SET"
            + " metadata=metadata||jsonb_build_object('lastCheckedAt',?::text,'observedHash',?::text,'changed',?::boolean),updated_at=now()"
            + " WHERE id=?",
        Instant.now().toString(),
        hash,
        changed,
        id);
    if (changed)
      db.jdbc.update(
          "INSERT INTO academic_domain_event(id,type,entity_id,provider,payload) VALUES"
              + " (?,'SOURCE_CHANGED',?,?,jsonb_build_object('observedHash',?::text,'actorId',?::text))",
          UUID.randomUUID(),
          id,
          source.get("provider"),
          hash,
          actor == null ? "scheduled" : actor.id().toString());
    return Map.of(
        "changed",
        changed,
        "observedHash",
        hash,
        "status",
        changed ? "PENDING_VERIFICATION" : "UNCHANGED");
  }

  @GetMapping("/events")
  public Object events(@RequestParam(defaultValue = "0") int page) {
    return db.list(
        "SELECT * FROM academic_domain_event ORDER BY created_at DESC,id LIMIT 30 OFFSET ?",
        Db.offset(page));
  }
}
