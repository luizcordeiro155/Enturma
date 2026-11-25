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

  /** Where an imported project came from. Only public repository data, chosen by the student. */
  public record GithubSource(
      @NotBlank @Size(max = 140) String fullName,
      @Min(0) Integer stars,
      Boolean fork,
      @Size(max = 40) String updatedAt) {}

  public record Project(
      UUID id,
      @NotBlank @Size(max = 120) String name,
      @Size(max = 500) String description,
      @Size(max = 300) String url,
      @Size(max = 6) List<UUID> assets,
      @Size(max = 20) String kind,
      @Size(max = 12) List<@Size(max = 40) String> technologies,
      @Size(max = 120) String subject,
      @Size(max = 40) String period,
      Boolean team,
      @Size(max = 300) String role,
      @Size(max = 300) String outcome,
      @Size(max = 300) String repoUrl,
      Boolean featured,
      Boolean archived,
      @Valid GithubSource github,
      /** Competencies from the portfolio's own list that this project is evidence of. */
      @Size(max = 12) List<@Size(max = 60) String> skills,
      /** A short case study in the student's words: problem, solution, challenges, result. */
      @Size(max = 1500) String caseStudy,
      /** Set when the project is a member's copy of someone else's team project. */
      @Valid SharedFrom sharedFrom) {}

  /** The author's project a member's copy came from. Kept only while the member is in the team. */
  public record SharedFrom(UUID userId, UUID projectId) {}

  public record Portfolio(
      boolean publicProfile,
      @Size(max = 140) String headline,
      @Size(max = 1200) String summary,
      @Size(max = 30) List<@Size(max = 60) String> skills,
      @Size(max = 60) List<@Valid Project> projects,
      @Size(max = 200) String goal,
      /** The area chosen by the student, "AUTO" to follow the course again, absent to keep it. */
      @Size(max = 20) String track) {}

  @GetMapping("/portfolio/me")
  public Object mine(@AuthenticationPrincipal Actor a) {
    return build(a.id(), true);
  }

  @org.springframework.transaction.annotation.Transactional
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
    List<Project> projects = r.projects() == null ? List.of() : r.projects();
    boolean follow = "AUTO".equals(r.track());
    if (r.track() != null && !follow && !PortfolioTracks.known(r.track()))
      throw ApiException.invalid("Escolha uma área válida para o portfólio.");
    if (projects.size() > MAX_PROJECTS)
      throw ApiException.invalid("O portfólio guarda até " + MAX_PROJECTS + " projetos.");
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", a.id());
    var stored = new ArrayList<Map<String, Object>>();
    int featured = 0;
    for (var project : projects) {
      if (project == null || project.name() == null || project.name().isBlank())
        throw ApiException.invalid("Dê um nome a cada projeto.");
      String url = link(project.url(), "Use um link HTTP ou HTTPS válido no projeto.");
      String repo = link(project.repoUrl(), "Use um link HTTP ou HTTPS válido no repositório.");
      if (project.kind() != null && !KINDS.contains(project.kind()))
        throw ApiException.invalid("Escolha um tipo de projeto válido.");
      for (UUID asset : project.assets() == null ? List.<UUID>of() : project.assets())
        if (!db.exists(
            "SELECT EXISTS(SELECT 1 FROM portfolio_attachment WHERE id=? AND user_id=?)",
            asset,
            a.id())) throw ApiException.invalid("Um arquivo do projeto não está disponível.");
      boolean archived = Boolean.TRUE.equals(project.archived());
      boolean star = Boolean.TRUE.equals(project.featured()) && !archived;
      if (star && ++featured > MAX_FEATURED)
        throw ApiException.invalid("Escolha até " + MAX_FEATURED + " projetos em destaque.");
      var row = new LinkedHashMap<String, Object>();
      row.put("id", project.id() == null ? UUID.randomUUID() : project.id());
      row.put("name", project.name().strip());
      row.put("description", text(project.description()));
      row.put("url", url);
      row.put("assets", project.assets() == null ? List.of() : project.assets());
      if (project.kind() != null) row.put("kind", project.kind());
      var technologies = labels(project.technologies(), 12);
      if (!technologies.isEmpty()) row.put("technologies", technologies);
      keep(row, "subject", project.subject());
      keep(row, "period", project.period());
      if (Boolean.TRUE.equals(project.team())) row.put("team", true);
      keep(row, "role", project.role());
      keep(row, "outcome", project.outcome());
      if (!repo.isEmpty()) row.put("repoUrl", repo);
      if (star) row.put("featured", true);
      if (archived) row.put("archived", true);
      if (project.github() != null) row.put("github", github(project.github(), repo));
      var shown = labels(project.skills(), 12);
      if (!shown.isEmpty()) row.put("skills", shown);
      keep(row, "caseStudy", project.caseStudy());
      // A copy keeps pointing at the author's project only while this student is in its team.
      var from = project.sharedFrom();
      if (from != null
          && from.userId() != null
          && from.projectId() != null
          && db.exists(
              "SELECT EXISTS(SELECT 1 FROM portfolio_project_member WHERE owner_id=? AND"
                  + " project_id=? AND member_id=? AND status='ACCEPTED')",
              from.userId(),
              from.projectId(),
              a.id()))
        row.put("sharedFrom", Map.of("userId", from.userId(), "projectId", from.projectId()));
      stored.add(row);
    }
    db.jdbc.update(
        "INSERT INTO portfolio_profile(user_id,public,headline,summary,skills,projects,goal,"
            + "track,updated_at) VALUES (?,?,?,?,?::jsonb,?::jsonb,coalesce(?,''),?,now())"
            + " ON CONFLICT(user_id) DO UPDATE SET"
            + " public=EXCLUDED.public,headline=EXCLUDED.headline,summary=EXCLUDED.summary,"
            + " skills=EXCLUDED.skills,projects=EXCLUDED.projects,"
            // a client that does not send the goal (an older app) leaves it as it was
            + " goal=coalesce(?,portfolio_profile.goal),"
            // the same for the area: absent keeps it, "AUTO" hands it back to the course
            + " track=CASE WHEN ? THEN NULL ELSE coalesce(?,portfolio_profile.track) END,"
            + " updated_at=now()",
        a.id(),
        r.publicProfile(),
        Objects.toString(r.headline(), "").strip(),
        Objects.toString(r.summary(), "").strip(),
        json.writeValueAsString(skills),
        json.writeValueAsString(stored),
        r.goal() == null ? null : r.goal().strip(),
        follow ? null : r.track(),
        r.goal() == null ? null : r.goal().strip(),
        follow,
        follow ? null : r.track());
    // A project that left the portfolio has no team any more.
    db.jdbc.update(
        "DELETE FROM portfolio_project_member WHERE owner_id=? AND NOT (project_id = ANY(?))",
        a.id(),
        stored.stream().map(row -> (UUID) row.get("id")).toArray(UUID[]::new));
  }

  private static final int MAX_PROJECTS = 60;
  private static final int MAX_FEATURED = 6;
  private static final Set<String> KINDS =
      Set.of(
          "ACADEMIC",
          "PERSONAL",
          "OPEN_SOURCE",
          "RESEARCH",
          "INTERNSHIP",
          "VOLUNTEER",
          "CASE_STUDY",
          "PUBLICATION",
          "CREATIVE",
          "COMPETITION");
  private static final java.util.regex.Pattern REPOSITORY =
      java.util.regex.Pattern.compile("[A-Za-z0-9-]{1,39}/[A-Za-z0-9._-]{1,100}");

  private static String text(String value) {
    return value == null ? "" : value.strip();
  }

  private static void keep(Map<String, Object> row, String key, String value) {
    if (value != null && !value.isBlank()) row.put(key, value.strip());
  }

  /** Trimmed labels without blanks or repeats that differ only in case. */
  private static List<String> labels(List<String> values, int limit) {
    var seen = new HashSet<String>();
    var out = new ArrayList<String>();
    if (values != null)
      for (String value : values) {
        if (value == null || value.isBlank()) continue;
        String label = value.strip();
        if (seen.add(label.toLowerCase(Locale.ROOT)) && out.size() < limit) out.add(label);
      }
    return out;
  }

  private static String link(String value, String message) {
    if (value == null || value.isBlank()) return "";
    try {
      var uri = java.net.URI.create(value.strip());
      if (uri.getScheme() == null
          || !Set.of("http", "https").contains(uri.getScheme().toLowerCase(Locale.ROOT))
          || uri.getHost() == null
          || uri.getUserInfo() != null) throw new IllegalArgumentException();
      return value.strip();
    } catch (IllegalArgumentException e) {
      throw ApiException.invalid(message);
    }
  }

  /** The GitHub label only stands beside the repository it names. */
  private static Map<String, Object> github(GithubSource source, String repo) {
    String name = text(source.fullName());
    if (!REPOSITORY.matcher(name).matches()
        || !repo.replaceFirst("/+$", "").equalsIgnoreCase("https://github.com/" + name))
      throw ApiException.invalid("O repositório do GitHub não confere com o link do projeto.");
    var row = new LinkedHashMap<String, Object>();
    row.put("fullName", name);
    if (source.stars() != null) row.put("stars", Math.max(0, source.stars()));
    if (Boolean.TRUE.equals(source.fork())) row.put("fork", true);
    keep(row, "updatedAt", source.updatedAt());
    return row;
  }

  @GetMapping("/public/portfolio/{username}")
  public Object publicPortfolio(@PathVariable String username) {
    UUID id =
        (UUID)
            db.one(
                    "SELECT id FROM app_user WHERE lower(username)=lower(?) AND status='ACTIVE'",
                    username.replaceFirst("^@", ""))
                .get("id");
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM portfolio_profile WHERE user_id=? AND public)", id))
      throw ApiException.missing();
    return build(id, false);
  }

  /** The course above the period the student is enrolled in, when there is one. */
  private String course(UUID user) {
    return db
        .list(
            "WITH RECURSIVE up AS (SELECT e.parent_id,e.kind,e.name,0 depth FROM academic_entry e"
                + " JOIN academic_enrollment en ON en.period_id=e.id WHERE en.user_id=?"
                + " UNION ALL SELECT p.parent_id,p.kind,p.name,up.depth+1 FROM academic_entry p"
                + " JOIN up ON up.parent_id=p.id WHERE up.depth<6)"
                + " SELECT name FROM up WHERE kind='COURSE' LIMIT 1",
            user)
        .stream()
        .map(row -> (String) row.get("name"))
        .findFirst()
        .orElse(null);
  }

  private Object build(UUID user, boolean owner) {
    var base =
        db.one(
            "SELECT u.id,u.name,u.username,u.bio,u.accent_color,"
                + " u.avatar_bytes IS NOT NULL has_avatar,u.banner_bytes IS NOT NULL has_banner,"
                + " coalesce(p.public,false) public_profile,coalesce(p.headline,'') headline,"
                + " coalesce(p.summary,'') summary,coalesce(p.goal,'') goal,p.track track_choice,"
                + " coalesce(p.skills,'[]'::jsonb) skills,"
                + " coalesce(p.projects,'[]'::jsonb) projects"
                + " FROM app_user u LEFT JOIN portfolio_profile p ON p.user_id=u.id WHERE u.id=?",
            user);
    if (!owner && !Boolean.TRUE.equals(base.get("publicProfile"))) throw ApiException.missing();
    // The area follows the enrolled course until the student chooses one.
    String course = course(user);
    Object choice = base.get("trackChoice");
    base.put("track", PortfolioTracks.known((String) choice) ? choice : PortfolioTracks.of(course));
    if (owner) {
      base.put("course", course);
      base.put("courseTrack", PortfolioTracks.of(course));
    } else base.remove("trackChoice");
    // Archived projects are the owner's alone: visitors get neither the project nor its files.
    if (!owner && base.get("projects") instanceof com.fasterxml.jackson.databind.node.ArrayNode all) {
      var open = json.createArrayNode();
      for (var project : all) if (!project.path("archived").asBoolean(false)) open.add(project);
      base.put("projects", open);
    }

    base.put(
        "assets",
        db.list(
            "SELECT a.id,a.name,a.mime,octet_length(a.data) size FROM portfolio_attachment a WHERE"
                + " a.user_id=? AND (? OR EXISTS(SELECT 1 FROM portfolio_profile"
                + " p,jsonb_array_elements(p.projects) project WHERE p.user_id=a.user_id AND"
                + " NOT coalesce((project->>'archived')::boolean,false) AND"
                + " project->'assets' @> jsonb_build_array(a.id::text))) ORDER BY a.created_at",
            user,
            owner));
    // Who else made each project: only people who accepted, each in their own words.
    if (!owner) PortfolioTeamController.attach(db, json, user, base.get("projects"));
    // Visitors get the records the student chose to show, and nothing about where they came from.
    if (!owner) base.put("journey", PortfolioJourneyController.shown(db, user, base.get("projects")));
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
                + " coalesce((SELECT current_streak FROM learning_stats WHERE user_id=?),0)"
                + " current_streak",
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
