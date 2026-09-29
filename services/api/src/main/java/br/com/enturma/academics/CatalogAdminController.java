package br.com.enturma.academics;

import br.com.enturma.academics.provider.*;
import br.com.enturma.academics.provider.emec.EmecAcademicProvider;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/catalog")
public class CatalogAdminController {
  private final Db db;
  private final CatalogImports imports;
  private final List<AcademicCatalogProvider> providers;
  private final ObjectMapper json;
  private final EmecAcademicProvider emec;

  public CatalogAdminController(
      Db db,
      CatalogImports imports,
      List<AcademicCatalogProvider> providers,
      ObjectMapper json,
      EmecAcademicProvider emec) {
    this.db = db;
    this.imports = imports;
    this.providers = providers;
    this.json = json;
    this.emec = emec;
  }

  @GetMapping("/summary")
  public Object summary() {
    var counts = new LinkedHashMap<String, Object>();
    for (String table :
        List.of(
            "institution",
            "campus",
            "course",
            "course_offering",
            "curriculum",
            "subject",
            "subject_topic",
            "source"))
      counts.put(
          table, db.jdbc.queryForObject("SELECT count(*) FROM academic_" + table, Long.class));
    counts.put(
        "activeJobs",
        db.jdbc.queryForObject(
            "SELECT count(*) FROM academic_import_job WHERE status IN"
                + " ('PENDING','RUNNING','PAUSED')",
            Long.class));
    counts.put(
        "pending",
        db.jdbc.queryForObject(
            "SELECT count(*) FROM academic_import_item WHERE status='PENDING_VERIFICATION'",
            Long.class));
    counts.put(
        "verified",
        db.jdbc.queryForObject(
            "SELECT count(*) FROM academic_entry WHERE status='VERIFIED'", Long.class));
    counts.put("total", db.jdbc.queryForObject("SELECT count(*) FROM academic_entry", Long.class));
    counts.put(
        "lastImport",
        db.list(
            "SELECT completed_at FROM academic_import_job WHERE completed_at IS NOT NULL ORDER BY"
                + " completed_at DESC LIMIT 1"));
    return counts;
  }

  @GetMapping("/providers")
  public Object providers() {
    return providers.stream().map(AcademicCatalogProvider::discover).toList();
  }

  @PostMapping("/providers/{code}/imports")
  @ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
  public Object providerImport(
      @AuthenticationPrincipal Actor actor, @PathVariable String code, HttpServletRequest request) {
    var provider =
        providers.stream()
            .filter(p -> p.supports(code))
            .findFirst()
            .orElseThrow(ApiException::missing);
    return Map.of(
        "id",
        imports.submit(
            actor, provider.importCurriculum(), String.valueOf(request.getAttribute("requestId"))));
  }

  @PostMapping("/imports")
  @ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
  public Object submit(
      @AuthenticationPrincipal Actor actor,
      @Valid @RequestBody CatalogRecord.Document document,
      HttpServletRequest request) {
    if (document.provider().equals("EMEC")) emec.validate(document);
    return Map.of(
        "id", imports.submit(actor, document, String.valueOf(request.getAttribute("requestId"))));
  }

  @PostMapping(value = "/imports/csv", consumes = "text/csv")
  @ResponseStatus(org.springframework.http.HttpStatus.ACCEPTED)
  public Object csv(
      @AuthenticationPrincipal Actor actor,
      @RequestParam String provider,
      @RequestBody String csv,
      HttpServletRequest request) {
    return submit(actor, CatalogCsv.parse(provider, csv, json), request);
  }

  @GetMapping("/imports")
  public Object jobs(@RequestParam(defaultValue = "0") int page) {
    return db.list(
        "SELECT * FROM academic_import_job ORDER BY created_at DESC,id LIMIT 30 OFFSET ?",
        Db.offset(page));
  }

  @GetMapping("/imports/{id}")
  public Object job(@PathVariable UUID id, @RequestParam(defaultValue = "0") int page) {
    return Map.of(
        "job",
        db.one("SELECT * FROM academic_import_job WHERE id=?", id),
        "items",
        db.list(
            "SELECT"
                + " id,entity_type,external_id,status,source_url,error_code,error_message,processed_at"
                + " FROM academic_import_item WHERE job_id=? ORDER BY ordinal LIMIT 30 OFFSET ?",
            id,
            Db.offset(page)));
  }

  @PostMapping("/imports/{id}/{action}")
  public void control(
      @AuthenticationPrincipal Actor actor, @PathVariable UUID id, @PathVariable String action) {
    imports.control(actor, id, action);
  }

  @GetMapping("/review")
  public Object review(@RequestParam(defaultValue = "0") int page) {
    var rows =
        db.list(
            "SELECT i.*,j.provider FROM academic_import_item i JOIN academic_import_job j ON"
                + " j.id=i.job_id WHERE i.status IN ('PENDING_VERIFICATION','FAILED') ORDER BY"
                + " i.created_at,i.ordinal LIMIT 30 OFFSET ?",
            Db.offset(page));
    for (var row : rows) {
      row.put("payload", imports.decode(row.get("payload")));
      if (row.get("entityId") != null)
        row.put("current", db.list("SELECT * FROM academic_entry WHERE id=?", row.get("entityId")));
    }
    return rows;
  }

  public record Review(String action, CatalogRecord correction) {}

  @PostMapping("/review/{id}")
  public void reviewItem(
      @AuthenticationPrincipal Actor actor, @PathVariable UUID id, @RequestBody Review review) {
    imports.review(actor, id, review.action(), review.correction());
  }

  @GetMapping("/sources")
  public Object sources(@RequestParam(defaultValue = "0") int page) {
    return db.list(
        "SELECT"
            + " id,provider,source_type,source_name,source_url,retrieved_at,verified_at,content_hash,status"
            + " FROM academic_source ORDER BY retrieved_at DESC,id LIMIT 30 OFFSET ?",
        Db.offset(page));
  }

  @GetMapping("/audit")
  public Object audit(
      @RequestParam(required = false) UUID entityId, @RequestParam(defaultValue = "0") int page) {
    var rows =
        db.list(
            "SELECT * FROM academic_catalog_audit WHERE (?::uuid IS NULL OR entity_id=?) ORDER BY"
                + " created_at DESC,id LIMIT 30 OFFSET ?",
            entityId,
            entityId,
            Db.offset(page));
    for (var row : rows) {
      for (String key : List.of("beforeValue", "afterValue"))
        try {
          row.put(key, json.readTree(String.valueOf(row.get(key))));
        } catch (Exception e) {
          row.put(key, null);
        }
    }
    return rows;
  }

  @GetMapping("/duplicates")
  public Object duplicates() {
    return db.list(
        "SELECT academic_normalize(name) normalized_name,kind,count(*) candidates,array_agg(id) ids"
            + " FROM academic_entry WHERE kind IN ('INSTITUTION','COURSE','SUBJECT') GROUP BY"
            + " kind,academic_normalize(name) HAVING count(*)>1 ORDER BY count(*) DESC LIMIT 30");
  }
}
