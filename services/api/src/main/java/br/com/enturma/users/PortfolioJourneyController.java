package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minha Jornada: the timeline of a student's portfolio. Records belong to the student and stay
 * private until they say otherwise. The platform may point at things it already knows (a finished
 * calendar activity, an achievement, a project) but only the student turns one into a record.
 */
@RestController
@RequestMapping("/api/v1")
public class PortfolioJourneyController {
  static final int MAX_ENTRIES = 200;
  static final Set<String> KINDS =
      Set.of(
          "PROJECT", "TEAM", "COURSE", "ACHIEVEMENT", "CERTIFICATE", "ACTIVITY", "GOAL",
          "MILESTONE");
  private static final Pattern SOURCE =
      Pattern.compile("(task|achievement|project):[A-Za-z0-9_.-]{1,60}");
  private static final Pattern SEMESTER = Pattern.compile("\\b((?:19|20)\\d{2})[./-]([12])\\b");
  /** A calendar activity that can be offered: a real event, and already behind the student. */
  private static final String HAPPENED =
      "t.kind IN ('EXAM','ASSIGNMENT','PRESENTATION','GROUP','EVENT') AND t.due_at<now()";
  /** The day is read in the student's own time zone, as the calendar shows it. */
  private static final String ZONE =
      "coalesce((SELECT r.timezone FROM academic_routine r WHERE r.user_id=t.user_id),"
          + "'America/Sao_Paulo')";
  private static final String COLUMNS = "id,kind,title,detail,happened_on AS date,visible,source";

  private final Db db;

  public PortfolioJourneyController(Db db) {
    this.db = db;
  }

  public record Entry(
      @NotBlank @Size(max = 16) String kind,
      @NotBlank @Size(max = 140) String title,
      @Size(max = 600) String detail,
      @NotBlank @Size(max = 10) String date,
      Boolean visible,
      @Size(max = 80) String source) {}

  public record Dismissal(@NotBlank @Size(max = 80) String source) {}

  @GetMapping("/portfolio/me/journey")
  public Object mine(@AuthenticationPrincipal Actor a) {
    var out = new LinkedHashMap<String, Object>();
    out.put(
        "entries",
        db.list(
            "SELECT " + COLUMNS + " FROM portfolio_journey_entry WHERE user_id=?"
                + " ORDER BY happened_on DESC,created_at DESC",
            a.id()));
    out.put("suggestions", suggestions(a.id()));
    return out;
  }

  @Transactional
  @PostMapping("/portfolio/me/journey")
  public Object add(@AuthenticationPrincipal Actor a, @Valid @RequestBody Entry r) {
    String kind = kind(r.kind());
    String title = title(r.title());
    LocalDate date = date(r.date());
    String source = r.source() == null || r.source().isBlank() ? null : r.source().strip();
    if (source != null) {
      // Only a record of the student's own that is still on offer can back an entry.
      if (!SOURCE.matcher(source).matches() || !eligible(a.id(), source))
        throw ApiException.missing();
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM portfolio_journey_entry WHERE user_id=? AND source=?)",
          a.id(),
          source))
        throw new ApiException(409, "ALREADY_THERE", "Este registro já está na sua jornada.");
    }
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM portfolio_journey_entry WHERE user_id=?", Integer.class, a.id())
        >= MAX_ENTRIES)
      throw ApiException.invalid("Sua jornada chegou ao limite de " + MAX_ENTRIES + " registros.");
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO portfolio_journey_entry(id,user_id,kind,title,detail,happened_on,visible,source)"
            + " VALUES (?,?,?,?,?,?,?,?)",
        id,
        a.id(),
        kind,
        title,
        text(r.detail()),
        date,
        // silence is not consent to publish
        Boolean.TRUE.equals(r.visible()),
        source);
    if (source != null)
      db.jdbc.update(
          "DELETE FROM portfolio_journey_dismissal WHERE user_id=? AND source=?", a.id(), source);
    return one(a.id(), id);
  }

  @PutMapping("/portfolio/me/journey/{id}")
  public Object edit(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Entry r) {
    int changed =
        db.jdbc.update(
            "UPDATE portfolio_journey_entry SET kind=?,title=?,detail=?,happened_on=?,"
                + "visible=coalesce(?,visible) WHERE id=? AND user_id=?",
            kind(r.kind()),
            title(r.title()),
            text(r.detail()),
            date(r.date()),
            r.visible(),
            id,
            a.id());
    if (changed == 0) throw ApiException.missing();
    return one(a.id(), id);
  }

  @DeleteMapping("/portfolio/me/journey/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void remove(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    if (db.jdbc.update("DELETE FROM portfolio_journey_entry WHERE id=? AND user_id=?", id, a.id())
        == 0) throw ApiException.missing();
  }

  /** "Not this one": the suggestion stops being offered. */
  @PostMapping("/portfolio/me/journey/dismissals")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void dismiss(@AuthenticationPrincipal Actor a, @Valid @RequestBody Dismissal r) {
    if (!SOURCE.matcher(r.source()).matches()) throw ApiException.invalid("Sugestão inválida.");
    db.jdbc.update(
        "INSERT INTO portfolio_journey_dismissal(user_id,source) VALUES (?,?) ON CONFLICT DO"
            + " NOTHING",
        a.id(),
        r.source());
  }

  /** What visitors of a public portfolio see: shown records, newest first. */
  static List<Map<String, Object>> shown(Db db, UUID user, Object projects) {
    var open = new HashSet<String>();
    if (projects instanceof JsonNode list)
      for (JsonNode project : list)
        if (!project.path("archived").asBoolean(false)) open.add(project.path("id").asText());
    var rows =
        db.list(
            "SELECT id,kind,title,detail,happened_on AS date,source FROM portfolio_journey_entry"
                + " WHERE user_id=? AND visible ORDER BY happened_on DESC,created_at DESC",
            user);
    for (var row : rows) {
      // Where a record came from is the student's business; only a visible project is linked.
      Object source = row.remove("source");
      if (source instanceof String s && s.startsWith("project:") && open.contains(s.substring(8)))
        row.put("projectId", s.substring(8));
    }
    return rows;
  }

  private Map<String, Object> one(UUID user, UUID id) {
    return db.one(
        "SELECT " + COLUMNS + " FROM portfolio_journey_entry WHERE id=? AND user_id=?", id, user);
  }

  private List<Map<String, Object>> suggestions(UUID user) {
    var taken =
        new HashSet<>(
            db.jdbc.queryForList(
                "SELECT source FROM portfolio_journey_entry WHERE user_id=? AND source IS NOT NULL"
                    + " UNION SELECT source FROM portfolio_journey_dismissal WHERE user_id=?",
                String.class,
                user,
                user));
    var out = new ArrayList<Map<String, Object>>();
    for (var project : projects(user)) {
      String source = "project:" + project.path("id").asText();
      if (project.path("archived").asBoolean(false) || taken.contains(source)) continue;
      out.add(
          suggestion(
              source,
              project.path("team").asBoolean(false) ? "TEAM" : "PROJECT",
              project.path("name").asText(""),
              project.path("description").asText(""),
              projectDate(project),
              "Projeto do portfólio"));
    }
    // Calendar activities whose day has passed, minus classes and study blocks, which are
    // routine. The calendar keeps no "done" mark, so the student is the one who says it
    // happened. Their private notes on the task are never part of the offer.
    for (var task :
        db.list(
            "SELECT t.id,t.kind,t.title,(t.due_at AT TIME ZONE " + ZONE + ")::date AS date"
                + " FROM campus_task t WHERE t.user_id=? AND " + HAPPENED
                + " ORDER BY t.due_at DESC LIMIT 40",
            user)) {
      String source = "task:" + task.get("id");
      if (taken.contains(source)) continue;
      out.add(
          suggestion(
              source,
              "GROUP".equals(task.get("kind")) ? "TEAM" : "ACTIVITY",
              (String) task.get("title"),
              "",
              (String) task.get("date"),
              "Atividade do seu calendário"));
    }
    for (var earned :
        db.list(
            "SELECT a.code,d.name,d.description,a.earned_at::date AS date FROM user_achievement a"
                + " JOIN achievement_definition d ON d.code=a.code WHERE a.user_id=?"
                + " ORDER BY a.earned_at DESC LIMIT 40",
            user)) {
      String source = "achievement:" + earned.get("code");
      if (taken.contains(source)) continue;
      out.add(
          suggestion(
              source,
              "ACHIEVEMENT",
              (String) earned.get("name"),
              (String) earned.get("description"),
              (String) earned.get("date"),
              "Conquista no Enturma"));
    }
    return out.size() > 30 ? out.subList(0, 30) : out;
  }

  private static Map<String, Object> suggestion(
      String source, String kind, String title, String detail, String date, String origin) {
    var row = new LinkedHashMap<String, Object>();
    row.put("source", source);
    row.put("kind", kind);
    row.put("title", clamp(title, 140));
    row.put("detail", clamp(detail, 600));
    // no date known: the student says when it happened
    if (date != null) row.put("date", date);
    row.put("origin", origin);
    return row;
  }

  private boolean eligible(UUID user, String source) {
    String id = source.substring(source.indexOf(':') + 1);
    if (source.startsWith("task:"))
      return uuid(id) != null
          && db.exists(
              "SELECT EXISTS(SELECT 1 FROM campus_task t WHERE t.id=? AND t.user_id=? AND "
                  + HAPPENED
                  + ")",
              uuid(id),
              user);
    if (source.startsWith("achievement:"))
      return db.exists(
          "SELECT EXISTS(SELECT 1 FROM user_achievement WHERE user_id=? AND code=?)", user, id);
    for (var project : projects(user))
      if (project.path("id").asText().equals(id)) return !project.path("archived").asBoolean(false);
    return false;
  }

  private Iterable<JsonNode> projects(UUID user) {
    var rows = db.list("SELECT projects FROM portfolio_profile WHERE user_id=?", user);
    return rows.isEmpty() || !(rows.get(0).get("projects") instanceof JsonNode list)
        ? List.of()
        : list;
  }

  /** "2026.1" starts in March, "2026.2" in August; otherwise the import's last update. */
  private static String projectDate(JsonNode project) {
    var semester = SEMESTER.matcher(project.path("period").asText(""));
    if (semester.find())
      return semester.group(1) + (semester.group(2).equals("1") ? "-03-01" : "-08-01");
    String updated = project.path("github").path("updatedAt").asText("");
    return updated.length() >= 10 && updated.substring(0, 10).matches("\\d{4}-\\d{2}-\\d{2}")
        ? updated.substring(0, 10)
        : null;
  }

  private static UUID uuid(String value) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }

  private static String kind(String value) {
    if (value == null || !KINDS.contains(value))
      throw ApiException.invalid("Escolha o tipo do registro.");
    return value;
  }

  private static String title(String value) {
    String title = clamp(value, 140);
    if (title.isEmpty()) throw ApiException.invalid("Dê um título ao registro.");
    return title;
  }

  private static LocalDate date(String value) {
    LocalDate date;
    try {
      date = LocalDate.parse(value == null ? "" : value.strip());
    } catch (Exception e) {
      throw ApiException.invalid("Informe a data do registro.");
    }
    // Goals can be ahead, but a timeline is not a place for the year 2199.
    if (date.getYear() < 1970 || date.isAfter(LocalDate.now().plusYears(10)))
      throw ApiException.invalid("Confira a data do registro.");
    return date;
  }

  private static String text(String value) {
    return clamp(value, 600);
  }

  private static String clamp(String value, int max) {
    String clean = value == null ? "" : value.strip();
    return clean.length() <= max ? clean : clean.substring(0, max).stripTrailing();
  }
}
