package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class PortfolioController {
  private final Db db;
  private final ObjectMapper json;

  public PortfolioController(Db db, ObjectMapper json) {
    this.db = db;
    this.json = json;
  }

  public record Project(
      @NotBlank @Size(max = 120) String name,
      @Size(max = 500) String description,
      @Size(max = 300) String url) {}

  public record Portfolio(
      boolean publicProfile,
      @Size(max = 140) String headline,
      @Size(max = 1200) String summary,
      @Size(max = 30) List<@Size(max = 60) String> skills,
      @Size(max = 12) List<@Valid Project> projects) {}

  @GetMapping("/portfolio/me")
  public Object mine(@AuthenticationPrincipal Actor a) {
    return build(a.id(), true);
  }

  @PutMapping("/portfolio/me")
  public void save(@AuthenticationPrincipal Actor a, @Valid @RequestBody Portfolio r)
      throws Exception {
    var skills =
        r.skills() == null
            ? List.of()
            : r.skills().stream()
                .filter(Objects::nonNull)
                .map(String::strip)
                .filter(v -> !v.isBlank())
                .distinct()
                .limit(30)
                .toList();
    var projects = r.projects() == null ? List.of() : r.projects();
    db.jdbc.update(
        "INSERT INTO portfolio_profile(user_id,public,headline,summary,skills,projects,updated_at)"
            + " VALUES (?,?,?,?,?::jsonb,?::jsonb,now()) ON CONFLICT(user_id) DO UPDATE SET"
            + " public=EXCLUDED.public,headline=EXCLUDED.headline,summary=EXCLUDED.summary,"
            + " skills=EXCLUDED.skills,projects=EXCLUDED.projects,updated_at=now()",
        a.id(),
        r.publicProfile(),
        Objects.toString(r.headline(), "").strip(),
        Objects.toString(r.summary(), "").strip(),
        json.writeValueAsString(skills),
        json.writeValueAsString(projects));
  }

  @GetMapping("/public/portfolio/{username}")
  public Object publicPortfolio(@PathVariable String username) {
    UUID id =
        (UUID)
            db.one(
                    "SELECT id FROM app_user WHERE lower(username)=lower(?) AND status='ACTIVE'",
                    username.replaceFirst("^@", ""))
                .get("id");
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM portfolio_profile WHERE user_id=? AND public)", id))
      throw ApiException.missing();
    return build(id, false);
  }

  private Object build(UUID user, boolean owner) {
    var base =
        db.one(
            "SELECT u.id,u.name,u.username,u.bio,u.accent_color,"
                + " u.avatar_bytes IS NOT NULL has_avatar,u.banner_bytes IS NOT NULL has_banner,"
                + " coalesce(p.public,false) public_profile,coalesce(p.headline,'') headline,"
                + " coalesce(p.summary,'') summary,coalesce(p.skills,'[]'::jsonb) skills,"
                + " coalesce(p.projects,'[]'::jsonb) projects"
                + " FROM app_user u LEFT JOIN portfolio_profile p ON p.user_id=u.id WHERE u.id=?",
            user);
    if (!owner && !Boolean.TRUE.equals(base.get("publicProfile"))) throw ApiException.missing();

    base.put(
        "subjects",
        db.list(
            "SELECT a.name FROM user_subject us JOIN academic_entry a ON a.id=us.subject_id"
                + " WHERE us.user_id=? ORDER BY a.name LIMIT 12",
            user));
    base.put(
        "achievements",
        db.list(
            "SELECT d.name,d.description,d.icon,d.tier,a.earned_at"
                + " FROM user_achievement a JOIN achievement_definition d ON d.code=a.code"
                + " WHERE a.user_id=? ORDER BY a.earned_at DESC LIMIT 8",
            user));
    base.put(
        "stats",
        db.one(
            "SELECT coalesce((SELECT total_xp FROM learning_stats WHERE user_id=?),0) total_xp,"
                + " coalesce((SELECT current_streak FROM learning_stats WHERE user_id=?),0) current_streak",
            user,
            user));
    base.put(
        "studyMinutes",
        db.one(
                "SELECT coalesce(sum(study_seconds),0)/60 study_minutes"
                    + " FROM room_participant WHERE user_id=?",
                user)
            .get("studyMinutes"));
    return base;
  }
}
