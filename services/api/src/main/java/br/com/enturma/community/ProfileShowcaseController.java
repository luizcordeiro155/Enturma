package br.com.enturma.community;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ProfileShowcaseController {
  private final Db db;
  private final AchievementService achievements;

  public ProfileShowcaseController(Db db, AchievementService achievements) {
    this.db = db;
    this.achievements = achievements;
  }

  private static final Set<String> FIELDS =
      Set.of("ACADEMIC", "STATS", "ACHIEVEMENTS", "JOINED", "WIDGETS");
  private static final Set<String> WIDGETS =
      Set.of(
          "SUBJECTS",
          "GOAL",
          "STREAK",
          "ACHIEVEMENTS",
          "NOTEBOOKS",
          "POSTS",
          "ROOMS",
          "HOURS",
          "PROJECTS",
          "TECHNOLOGIES",
          "ACADEMIC",
          "MINIGAMES");

  public record Widget(@NotBlank String kind, boolean visible, boolean favorite) {}

  public record Save(
      @NotNull @Pattern(regexp = "#[0-9a-fA-F]{6}") String secondaryColor,
      @NotNull @Pattern(regexp = "SOLID|GRADIENT") String theme,
      @NotNull @Pattern(regexp = "NONE|AURORA|DOTS") String effect,
      @NotNull @Pattern(regexp = "IDENTITY_FIRST|WIDGETS_FIRST") String layout,
      @NotNull @Size(max = 200) String goal,
      @NotNull @Size(max = 200) String technologies,
      @NotNull @Size(max = 1000) String projects,
      @NotNull @Size(max = 5) Map<String, Boolean> privacy,
      @NotNull @Size(max = 8) List<@NotNull @Valid Widget> widgets,
      @NotNull @Size(max = 4) List<@NotBlank String> badges) {}

  @PutMapping("/users/me/showcase")
  @Transactional
  public void save(@AuthenticationPrincipal Actor a, @Valid @RequestBody Save s) {
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", a.id());
    if (!FIELDS.containsAll(s.privacy().keySet())
        || s.privacy().values().stream().anyMatch(Objects::isNull)
        || s.widgets().stream().map(Widget::kind).distinct().count() != s.widgets().size()
        || s.badges().stream().distinct().count() != s.badges().size())
      throw ApiException.invalid("Personalização inválida.");
    for (var w : s.widgets())
      if (!WIDGETS.contains(w.kind())) throw ApiException.invalid("Widget inválido.");
    for (var code : s.badges())
      if (!db.exists(
          "SELECT EXISTS(SELECT 1 FROM user_achievement WHERE user_id=? AND code=?)", a.id(), code))
        throw ApiException.invalid("Destaque somente conquistas já recebidas.");
    db.jdbc.update(
        "INSERT INTO"
            + " profile_showcase(user_id,secondary_color,theme,effect,layout,goal,technologies,projects)"
            + " VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET"
            + " secondary_color=EXCLUDED.secondary_color,theme=EXCLUDED.theme,effect=EXCLUDED.effect,layout=EXCLUDED.layout,goal=EXCLUDED.goal,technologies=EXCLUDED.technologies,projects=EXCLUDED.projects",
        a.id(),
        s.secondaryColor(),
        s.theme(),
        s.effect(),
        s.layout(),
        s.goal(),
        s.technologies(),
        s.projects());
    for (String f : FIELDS)
      db.jdbc.update(
          "INSERT INTO profile_privacy_setting(user_id,field,visible) VALUES (?,?,?) ON"
              + " CONFLICT(user_id,field) DO UPDATE SET visible=EXCLUDED.visible",
          a.id(),
          f,
          Boolean.TRUE.equals(s.privacy().get(f)));
    db.jdbc.update("DELETE FROM profile_widget WHERE user_id=?", a.id());
    for (int i = 0; i < s.widgets().size(); i++) {
      var w = s.widgets().get(i);
      db.jdbc.update(
          "INSERT INTO profile_widget(id,user_id,kind,position,visible,favorite) VALUES"
              + " (?,?,?,?,?,?)",
          UUID.randomUUID(),
          a.id(),
          w.kind(),
          i,
          w.visible(),
          w.favorite());
    }
    db.jdbc.update("DELETE FROM profile_featured_badge WHERE user_id=?", a.id());
    for (int i = 0; i < s.badges().size(); i++)
      db.jdbc.update(
          "INSERT INTO profile_featured_badge(user_id,code,position) VALUES (?,?,?)",
          a.id(),
          s.badges().get(i),
          i);
  }

  @GetMapping("/users/{id}/showcase")
  public Object get(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR (user_id=?"
            + " AND blocked_id=?))",
        a.id(),
        id,
        id,
        a.id())) throw ApiException.forbidden();
    var user = db.one("SELECT id,created_at FROM app_user WHERE id=? AND status='ACTIVE'", id);
    boolean owner = a.id().equals(id);
    Map<String, Boolean> privacy = new LinkedHashMap<>();
    for (String f : FIELDS)
      privacy.put(
          f,
          db.exists(
              "SELECT EXISTS(SELECT 1 FROM profile_privacy_setting WHERE user_id=? AND field=? AND"
                  + " visible)",
              id,
              f));
    var result = new LinkedHashMap<String, Object>();
    var rows =
        db.list(
            "SELECT secondary_color,theme,effect,layout,goal,technologies,projects FROM"
                + " profile_showcase WHERE user_id=?",
            id);
    result.put(
        "appearance",
        rows.isEmpty()
            ? Map.of(
                "secondaryColor",
                "#799f80",
                "theme",
                "SOLID",
                "effect",
                "NONE",
                "layout",
                "IDENTITY_FIRST",
                "goal",
                "",
                "technologies",
                "",
                "projects",
                "")
            : rows.getFirst());
    if (!owner && !privacy.get("WIDGETS"))
      result.put(
          "appearance",
          rows.isEmpty()
              ? Map.of()
              : Map.of(
                  "secondaryColor",
                  rows.getFirst().get("secondaryColor"),
                  "theme",
                  rows.getFirst().get("theme"),
                  "effect",
                  rows.getFirst().get("effect"),
                  "layout",
                  rows.getFirst().get("layout")));
    if (owner) result.put("privacy", privacy);
    if (owner || privacy.get("JOINED")) result.put("joinedAt", user.get("createdAt"));
    if (owner || privacy.get("STATS")) result.put("stats", achievements.stats(id));
    if (owner || privacy.get("ACHIEVEMENTS")) {
      result.put(
          "achievements",
          owner
              ? achievements.list(id)
              : db.list(
                  "SELECT d.*,u.earned_at FROM user_achievement u JOIN achievement_definition d ON"
                      + " d.code=u.code WHERE user_id=? ORDER BY earned_at DESC",
                  id));
      result.put(
          "badges",
          db.list("SELECT code FROM profile_featured_badge WHERE user_id=? ORDER BY position", id));
    }
    if (owner || privacy.get("ACADEMIC"))
      result.put(
          "academic",
          db.list(
              "SELECT p.name period,c.name course,i.name institution FROM academic_enrollment e"
                  + " JOIN academic_entry p ON p.id=e.period_id JOIN academic_entry v ON"
                  + " v.id=p.parent_id JOIN academic_entry c ON c.id=v.parent_id JOIN"
                  + " academic_entry campus ON campus.id=c.parent_id JOIN academic_entry i ON"
                  + " i.id=campus.parent_id WHERE e.user_id=?",
              id));
    var widgets = new ArrayList<Map<String, Object>>();
    if (owner || privacy.get("WIDGETS"))
      for (var w :
          db.list(
              "SELECT kind,position,visible,favorite FROM profile_widget WHERE user_id=? ORDER BY"
                  + " position",
              id)) {
        if (!owner && !Boolean.TRUE.equals(w.get("visible"))) continue;
        String kind = (String) w.get("kind");
        if (!owner
            && ((Set.of("HOURS", "STREAK").contains(kind) && !privacy.get("STATS"))
                || (kind.equals("ACHIEVEMENTS") && !privacy.get("ACHIEVEMENTS"))
                || (Set.of("ACADEMIC", "SUBJECTS", "ROOMS").contains(kind)
                    && !privacy.get("ACADEMIC")))) continue;
        Object content =
            switch (kind) {
              case "SUBJECTS" ->
                  db.list(
                      "SELECT s.name FROM user_subject u JOIN academic_entry s ON s.id=u.subject_id"
                          + " WHERE u.user_id=? ORDER BY s.name LIMIT 6",
                      id);
              case "NOTEBOOKS" ->
                  db.list(
                      "SELECT title FROM study_notebook WHERE user_id=? ORDER BY updated_at DESC"
                          + " LIMIT 3",
                      id);
              case "POSTS" ->
                  db.list(
                      "SELECT id,title FROM forum_entry WHERE author_id=? AND root_id IS NULL AND"
                          + " NOT deleted ORDER BY created_at DESC LIMIT 3",
                      id);
              case "ROOMS" ->
                  db.list(
                      "SELECT DISTINCT s.name FROM room_participant p JOIN study_room r ON"
                          + " r.id=p.room_id JOIN academic_entry s ON s.id=r.subject_id WHERE"
                          + " p.user_id=? AND NOT p.removed LIMIT 6",
                      id);
              case "MINIGAMES" ->
                  db.list(
                      "SELECT game FROM learning_progress WHERE user_id=? AND completed GROUP BY"
                          + " game LIMIT 4",
                      id);
              default -> List.of();
            };
        w.put("content", content);
        widgets.add(w);
      }
    result.put("widgets", widgets);
    return result;
  }
}
