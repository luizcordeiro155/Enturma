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
            : " AND e.status='VERIFIED' AND NOT EXISTS (WITH RECURSIVE ancestors AS (SELECT"
                + " id,parent_id,status FROM academic_entry WHERE id=e.parent_id UNION ALL SELECT"
                + " p.id,p.parent_id,p.status FROM academic_entry p JOIN ancestors a ON"
                + " p.id=a.parent_id) SELECT 1 FROM ancestors WHERE status<>'VERIFIED')";
    return db.list(
        "SELECT e.*,s.retrieved_at,s.provider source_provider,cs.workload_hours,cs.subject_id"
            + " canonical_subject_id,o.shift,o.modality,EXISTS(SELECT 1 FROM academic_curriculum c"
            + " WHERE c.course_offering_id=e.id AND c.verification_status='VERIFIED')"
            + " has_curriculum FROM academic_entry e LEFT JOIN academic_source s ON"
            + " s.id=coalesce(e.source_id,e.id) LEFT JOIN academic_curriculum_subject cs ON"
            + " cs.id=e.id LEFT JOIN academic_course_offering o ON o.id=e.id WHERE e.kind=? AND"
            + " (?::uuid IS NULL OR e.parent_id=?) AND e.normalized_name LIKE '%' ||"
            + " academic_normalize(?) || '%'"
            + where
            + " ORDER BY CASE WHEN e.provider='UNA' THEN 0 ELSE 1 END, CASE WHEN e.normalized_name"
            + " LIKE '%aimores%' THEN 0 ELSE 1 END,has_curriculum DESC,e.period_number NULLS"
            + " LAST,coalesce(cs.order_index,0),e.name,e.id LIMIT 30 OFFSET ?",
        kind,
        parent,
        parent,
        search,
        Db.offset(page));
  }

  public Map<String, Object> verified(UUID id, String kind) {
    var entry =
        db.one(
            "SELECT * FROM academic_entry WHERE id=? AND kind=? AND status='VERIFIED'", id, kind);
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
      if (!Set.of("VERIFIED", "PENDING_VERIFICATION", "OUTDATED", "ARCHIVED", "REJECTED")
          .contains(e.status())) throw ApiException.invalid("Status inválido.");
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
      if (!previous.isEmpty() && !Objects.equals(previous.getFirst().get("provider"), "LEGACY"))
        throw ApiException.invalid(
            "Use a revisão de importações V2 para alterar registros de providers.");
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
