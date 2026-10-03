package br.com.enturma.teaching;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teaching")
public class TeachingController {
  private final Db db;

  public TeachingController(Db db) {
    this.db = db;
  }

  public record Profile(
      @Size(max = 180) String institution,
      @Size(max = 120) String title,
      boolean enabled) {}

  public record ClassRequest(
      UUID subjectId,
      @NotBlank @Size(max = 140) String name,
      @Size(max = 800) String description) {}

  public record Join(@NotBlank @Size(max = 10) String code) {}

  public record Assignment(
      @NotBlank @Size(max = 180) String title,
      @Size(max = 2000) String description,
      Instant dueAt,
      @Min(0) @Max(1000) int points) {}

  public record Submission(@Size(max = 1200) String note) {}

  @GetMapping
  public Object dashboard(@AuthenticationPrincipal Actor a) {
    var profile =
        db.list(
            "SELECT institution,title,enabled,verified FROM teacher_profile WHERE user_id=?",
            a.id());
    var owned =
        db.list(
            "SELECT c.id,c.name,c.description,c.join_code,c.archived,e.name subject_name,"
                + " (SELECT count(*) FROM teacher_class_member m WHERE m.class_id=c.id) members,"
                + " (SELECT count(*) FROM teacher_assignment x WHERE x.class_id=c.id) assignments"
                + " FROM teacher_class c LEFT JOIN academic_entry e ON e.id=c.subject_id"
                + " WHERE c.owner_id=? ORDER BY c.created_at DESC",
            a.id());
    var joined =
        db.list(
            "SELECT c.id,c.name,c.description,e.name subject_name,u.name teacher_name"
                + " FROM teacher_class_member m JOIN teacher_class c ON c.id=m.class_id"
                + " JOIN app_user u ON u.id=c.owner_id"
                + " LEFT JOIN academic_entry e ON e.id=c.subject_id"
                + " WHERE m.user_id=? AND NOT c.archived ORDER BY m.joined_at DESC",
            a.id());
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("profile", profile.isEmpty() ? null : profile.getFirst());
    out.put("owned", owned);
    out.put("joined", joined);
    return out;
  }

  @PutMapping("/profile")
  public void profile(@AuthenticationPrincipal Actor a, @Valid @RequestBody Profile r) {
    db.jdbc.update(
        "INSERT INTO teacher_profile(user_id,institution,title,enabled) VALUES (?,?,?,?)"
            + " ON CONFLICT(user_id) DO UPDATE SET institution=EXCLUDED.institution,"
            + " title=EXCLUDED.title,enabled=EXCLUDED.enabled,updated_at=now()",
        a.id(),
        Objects.toString(r.institution(), "").strip(),
        Objects.toString(r.title(), "Professor(a)").strip(),
        r.enabled());
  }

  @PostMapping("/classes")
  @Transactional
  public Object create(@AuthenticationPrincipal Actor a, @Valid @RequestBody ClassRequest r) {
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM teacher_profile WHERE user_id=? AND enabled)", a.id()))
      throw ApiException.invalid("Ative o modo professor primeiro.");
    String code;
    do {
      code = randomCode();
    } while (db.exists("SELECT EXISTS(SELECT 1 FROM teacher_class WHERE join_code=?)", code));
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO teacher_class(id,owner_id,subject_id,name,description,join_code)"
            + " VALUES (?,?,?,?,?,?)",
        id,
        a.id(),
        r.subjectId(),
        r.name().strip(),
        Objects.toString(r.description(), "").strip(),
        code);
    return Map.of("id", id, "joinCode", code);
  }

  @PostMapping("/classes/join")
  public Object join(@AuthenticationPrincipal Actor a, @Valid @RequestBody Join r) {
    var c =
        db.one(
            "SELECT id,name FROM teacher_class WHERE upper(join_code)=upper(?) AND NOT archived",
            r.code().strip());
    db.jdbc.update(
        "INSERT INTO teacher_class_member(class_id,user_id) VALUES (?,?) ON CONFLICT DO NOTHING",
        c.get("id"),
        a.id());
    return c;
  }

  @GetMapping("/classes/{id}")
  public Object detail(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    var c = db.one("SELECT * FROM teacher_class WHERE id=?", id);
    boolean owner = a.id().equals(c.get("ownerId"));
    boolean member =
        db.exists(
            "SELECT EXISTS(SELECT 1 FROM teacher_class_member WHERE class_id=? AND user_id=?)",
            id,
            a.id());
    if (!owner && !member) throw ApiException.forbidden();

    c.put(
        "members",
        db.list(
            "SELECT u.id,u.name,u.username,m.role,m.joined_at"
                + " FROM teacher_class_member m JOIN app_user u ON u.id=m.user_id"
                + " WHERE m.class_id=? ORDER BY m.joined_at",
            id));
    c.put(
        "assignments",
        db.list(
            "SELECT x.*,(SELECT count(*) FROM teacher_submission s WHERE s.assignment_id=x.id)"
                + " submissions,EXISTS(SELECT 1 FROM teacher_submission s"
                + " WHERE s.assignment_id=x.id AND s.user_id=?) submitted"
                + " FROM teacher_assignment x WHERE x.class_id=?"
                + " ORDER BY x.due_at NULLS LAST,x.created_at DESC",
            a.id(),
            id));
    c.put("owner", owner);
    return c;
  }

  @PostMapping("/classes/{id}/assignments")
  public Object assignment(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Assignment r) {
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM teacher_class WHERE id=? AND owner_id=?)", id, a.id()))
      throw ApiException.forbidden();

    UUID assignment = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO teacher_assignment(id,class_id,title,description,due_at,points)"
            + " VALUES (?,?,?,?,?,?)",
        assignment,
        id,
        r.title().strip(),
        Objects.toString(r.description(), "").strip(),
        r.dueAt(),
        r.points());
    return Map.of("id", assignment);
  }

  @PostMapping("/assignments/{id}/submit")
  public void submit(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Submission r) {
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM teacher_assignment x"
            + " JOIN teacher_class_member m ON m.class_id=x.class_id"
            + " WHERE x.id=? AND m.user_id=?)",
        id,
        a.id()))
      throw ApiException.forbidden();
    db.jdbc.update(
        "INSERT INTO teacher_submission(assignment_id,user_id,note) VALUES (?,?,?)"
            + " ON CONFLICT(assignment_id,user_id) DO UPDATE SET note=EXCLUDED.note,"
            + " status='DONE',submitted_at=now()",
        id,
        a.id(),
        Objects.toString(r.note(), "").strip());
  }

  private String randomCode() {
    String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var random = new java.security.SecureRandom();
    var b = new StringBuilder();
    for (int i = 0; i < 8; i++) b.append(alphabet.charAt(random.nextInt(alphabet.length())));
    return b.toString();
  }
}
