package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class PublicCatalogController {
  private final Db db;
  private final CatalogService catalog;

  public PublicCatalogController(Db db, CatalogService catalog) {
    this.db = db;
    this.catalog = catalog;
  }

  private static final Map<String, String> KINDS =
      Map.of(
          "institutions",
          "INSTITUTION",
          "campuses",
          "CAMPUS",
          "courses",
          "COURSE",
          "curricula",
          "CURRICULUM",
          "periods",
          "PERIOD",
          "subjects",
          "SUBJECT",
          "topics",
          "TOPIC");

  @GetMapping("/catalog/{resource}")
  public Object list(
      @PathVariable String resource,
      @RequestParam(required = false) UUID parentId,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page) {
    String kind = KINDS.get(resource);
    if (kind == null) throw ApiException.missing();
    var items = catalog.list(kind, parentId, search, page, false);
    return Map.of(
        "items", items, "page", Math.max(0, page), "pageSize", 30, "hasMore", items.size() == 30);
  }

  @GetMapping("/catalog/onboarding/options")
  public Object options(
      @RequestParam(defaultValue = "INSTITUTION") String kind,
      @RequestParam(required = false) UUID parentId,
      @RequestParam(defaultValue = "") String search,
      @RequestParam(defaultValue = "0") int page) {
    if (!KINDS.containsValue(kind)) throw ApiException.invalid("Etapa inválida.");
    return Map.of(
        "items", catalog.list(kind, parentId, search, page, false), "page", page, "pageSize", 30);
  }

  @GetMapping("/catalog/subjects/{id}")
  public Object subject(@PathVariable UUID id) {
    var entry = catalog.verified(id, "SUBJECT");
    var result = new LinkedHashMap<String, Object>(entry);
    result.put(
        "details",
        db.one(
            "SELECT cs.*,c.name curriculum_name,c.version,p.name period_name FROM"
                + " academic_curriculum_subject cs JOIN academic_curriculum c ON"
                + " c.id=cs.curriculum_id JOIN academic_curriculum_period p ON p.id=cs.period_id"
                + " WHERE cs.id=?",
            id));
    result.put("topics", catalog.list("TOPIC", id, "", 0, false));
    result.put(
        "prerequisites",
        db.list(
            "SELECT e.id,e.name FROM academic_subject_prerequisite p JOIN academic_entry e ON"
                + " e.id=p.prerequisite_id WHERE p.curriculum_subject_id=? AND e.status='VERIFIED'",
            id));
    return result;
  }

  @GetMapping("/catalog/coverage/summary")
  public Object coverage() {
    return db.list(
        "SELECT i.id,i.name,count(o.id) known_offerings,count(o.id) FILTER(WHERE EXISTS(SELECT 1"
            + " FROM academic_curriculum c WHERE c.course_offering_id=o.id AND"
            + " c.verification_status='VERIFIED')) offerings_with_curriculum FROM"
            + " academic_institution i LEFT JOIN academic_course_offering o ON"
            + " o.institution_id=i.id AND o.status='VERIFIED' WHERE i.status='VERIFIED' GROUP BY"
            + " i.id,i.name ORDER BY i.name");
  }

  public record Request(@NotNull UUID courseOfferingId) {}

  @PostMapping("/catalog/requests")
  public Object request(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Request request) {
    catalog.verified(request.courseOfferingId(), "COURSE");
    var course =
        db.one(
            "SELECT institution_id FROM academic_course_offering WHERE id=?",
            request.courseOfferingId());
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO academic_catalog_request(id,user_id,institution_id,course_offering_id) VALUES"
            + " (?,?,?,?) ON CONFLICT(user_id,course_offering_id) DO NOTHING",
        id,
        actor.id(),
        course.get("institutionId"),
        request.courseOfferingId());
    return Map.of("status", "OPEN");
  }

  @GetMapping("/admin/catalog/requests")
  public Object requests() {
    return db.list(
        "SELECT r.course_offering_id,e.name,count(*) requests,min(r.requested_at)"
            + " first_requested_at FROM academic_catalog_request r JOIN academic_entry e ON"
            + " e.id=r.course_offering_id WHERE r.status IN ('OPEN','IN_REVIEW') GROUP BY"
            + " r.course_offering_id,e.name ORDER BY count(*) DESC,min(r.requested_at) LIMIT 100");
  }

  @GetMapping("/admin/catalog/migration-report")
  public Object migration() {
    return db.list("SELECT * FROM academic_migration_report ORDER BY kind");
  }
}
