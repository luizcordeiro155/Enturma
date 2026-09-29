package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import java.net.URI;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
  private final Db db;
  private final ObjectMapper json;
  private static final Map<String, String> PARENTS =
      Map.of(
          "CAMPUS",
          "INSTITUTION",
          "COURSE",
          "CAMPUS",
          "CURRICULUM",
          "COURSE",
          "PERIOD",
          "CURRICULUM",
          "SUBJECT",
          "PERIOD",
          "TOPIC",
          "SUBJECT");

  public CatalogService(Db db, ObjectMapper json) {
    this.db = db;
    this.json = json;
  }

  public record Entry(
      @NotNull UUID id,
      @NotBlank String kind,
      UUID parentId,
      @NotBlank @Size(max = 200) String name,
      @Size(max = 80) String code,
      @Size(max = 40) String curriculumVersion,
      @Min(1) @Max(30) Integer periodNumber,
      @NotBlank @Size(max = 2000) String sourceUrl,
      @NotBlank @Size(max = 200) String sourceName,
      Instant verifiedAt,
      @NotNull LocalDate validFrom,
      LocalDate validUntil,
      @NotBlank String status) {}

  public List<Map<String, Object>> list(
      String kind, UUID parent, String search, int page, boolean admin) {
    String where =
        admin
            ? ""
            : " AND status='VERIFIED' AND valid_from<=CURRENT_DATE AND (valid_until IS NULL OR"
                + " valid_until>=CURRENT_DATE)";
    return db.list(
        "SELECT * FROM academic_entry WHERE kind=? AND (?::uuid IS NULL OR parent_id=?) AND"
            + " lower(name) LIKE lower(?)"
            + where
            + " ORDER BY name,id LIMIT 30 OFFSET ?",
        kind,
        parent,
        parent,
        "%" + search + "%",
        Db.offset(page));
  }

  public Map<String, Object> verified(UUID id, String kind) {
    var entry =
        db.one(
            "SELECT * FROM academic_entry WHERE id=? AND kind=? AND status='VERIFIED' AND"
                + " valid_from<=CURRENT_DATE AND (valid_until IS NULL OR"
                + " valid_until>=CURRENT_DATE)",
            id,
            kind);
    if (entry.get("parentId") != null) verified((UUID) entry.get("parentId"), PARENTS.get(kind));
    return entry;
  }

  @Transactional
  public void importEntries(Actor actor, List<Entry> entries) {
    if (!actor.admin()) throw ApiException.forbidden();
    if (entries.isEmpty() || entries.size() > 500)
      throw ApiException.invalid("Importe entre 1 e 500 registros por arquivo.");
    for (Entry e : entries) {
      if (!e.kind().equals("INSTITUTION") && !PARENTS.containsKey(e.kind()))
        throw ApiException.invalid("Tipo acadêmico inválido.");
      if (!Set.of("VERIFIED", "PENDING_VERIFICATION", "OUTDATED", "ARCHIVED").contains(e.status()))
        throw ApiException.invalid("Status inválido.");
      URI uri;
      try {
        uri = URI.create(e.sourceUrl());
      } catch (Exception ex) {
        throw ApiException.invalid("Fonte inválida.");
      }
      if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null)
        throw ApiException.invalid("Informe uma fonte oficial HTTPS.");
      if (e.validUntil() != null && e.validUntil().isBefore(e.validFrom()))
        throw ApiException.invalid("Vigência inválida.");
      if (e.status().equals("VERIFIED")
          && (e.verifiedAt() == null || e.verifiedAt().isAfter(Instant.now())))
        throw ApiException.invalid("Informe a data de verificação da fonte.");
      if (e.kind().equals("INSTITUTION")) {
        if (e.parentId() != null) throw ApiException.invalid("Instituição não possui pai.");
      } else if (e.parentId() == null
          || !db.exists(
              "SELECT EXISTS(SELECT 1 FROM academic_entry WHERE id=? AND kind=?)",
              e.parentId(),
              PARENTS.get(e.kind())))
        throw ApiException.invalid("Hierarquia inválida. Importe os pais primeiro.");
      if (e.kind().equals("CURRICULUM")
          && (e.curriculumVersion() == null || e.curriculumVersion().isBlank()))
        throw ApiException.invalid("Informe a versão da grade.");
      if (e.kind().equals("PERIOD") && e.periodNumber() == null)
        throw ApiException.invalid("Informe o número do período.");
      var previous = db.list("SELECT * FROM academic_entry WHERE id=? FOR UPDATE", e.id());
      if (!previous.isEmpty()
          && (!previous.getFirst().get("kind").equals(e.kind())
              || !Objects.equals(previous.getFirst().get("parentId"), e.parentId())))
        throw ApiException.invalid("Crie uma nova versão para alterar a hierarquia.");
      db.jdbc.update(
          "INSERT INTO"
              + " academic_entry(id,kind,parent_id,name,code,curriculum_version,period_number,source_url,source_name,verified_at,valid_from,valid_until,status)"
              + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET"
              + " name=EXCLUDED.name,code=EXCLUDED.code,source_url=EXCLUDED.source_url,source_name=EXCLUDED.source_name,verified_at=EXCLUDED.verified_at,valid_until=EXCLUDED.valid_until,status=EXCLUDED.status",
          e.id(),
          e.kind(),
          e.parentId(),
          e.name(),
          e.code(),
          e.curriculumVersion(),
          e.periodNumber(),
          e.sourceUrl(),
          e.sourceName(),
          e.verifiedAt() == null ? null : java.sql.Timestamp.from(e.verifiedAt()),
          e.validFrom(),
          e.validUntil(),
          e.status());
      try {
        db.jdbc.update(
            "INSERT INTO audit_log(id,actor_id,action,resource_id,before_value,after_value) VALUES"
                + " (?,?,'CATALOG_IMPORT',?,?::jsonb,?::jsonb)",
            UUID.randomUUID(),
            actor.id(),
            e.id(),
            json.writeValueAsString(previous),
            json.writeValueAsString(e));
      } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
        throw new IllegalStateException(ex);
      }
    }
  }
}
