package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import br.com.enturma.notifications.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
 * The team of a portfolio project. The author tags friends; a tagged person shows up to visitors
 * only after accepting, and what is said about their part is what they wrote. A member can take
 * the project into their own portfolio, where it stays marked as the team's work.
 */
@RestController
@RequestMapping("/api/v1")
public class PortfolioTeamController {
  static final int MAX_MEMBERS = 12;
  private static final int MAX_PROJECTS = 60;

  private final Db db;
  private final ObjectMapper json;
  private final NotificationService notifications;

  public PortfolioTeamController(Db db, ObjectMapper json, NotificationService notifications) {
    this.db = db;
    this.json = json;
    this.notifications = notifications;
  }

  public record Invite(@NotBlank @Size(max = 60) String username) {}

  public record Answer(@NotBlank @Size(max = 10) String status, @Size(max = 300) String contribution) {}

  /** The teams of my projects, and the projects other people tagged me in. */
  @GetMapping("/portfolio/me/team")
  public Object mine(@AuthenticationPrincipal Actor a) {
    var projects = new LinkedHashMap<String, List<Map<String, Object>>>();
    for (var row :
        db.list(
            "SELECT m.project_id,m.member_id user_id,u.name,u.username,m.status,m.contribution"
                + " FROM portfolio_project_member m JOIN app_user u ON u.id=m.member_id"
                + " WHERE m.owner_id=? AND u.status='ACTIVE' ORDER BY m.created_at",
            a.id())) {
      String project = String.valueOf(row.remove("projectId"));
      projects.computeIfAbsent(project, key -> new ArrayList<>()).add(row);
    }
    var mine = stored(a.id());
    var invitations = new ArrayList<Map<String, Object>>();
    for (var row :
        db.list(
            "SELECT m.owner_id,m.project_id,u.name owner_name,u.username owner_username,m.status,"
                + "m.contribution FROM portfolio_project_member m JOIN app_user u ON"
                + " u.id=m.owner_id WHERE m.member_id=? AND m.status<>'DECLINED' AND"
                + " u.status='ACTIVE' ORDER BY m.created_at DESC",
            a.id())) {
      JsonNode origin = project((UUID) row.get("ownerId"), (UUID) row.get("projectId"));
      // an archived or removed project is no longer anyone's to answer
      if (origin == null) continue;
      row.put("projectName", origin.path("name").asText(""));
      row.put("projectDescription", origin.path("description").asText(""));
      row.put("included", copyOf(mine, (UUID) row.get("ownerId"), (UUID) row.get("projectId")));
      invitations.add(row);
    }
    var out = new LinkedHashMap<String, Object>();
    out.put("projects", projects);
    out.put("invitations", invitations);
    return out;
  }

  @Transactional
  @PostMapping("/portfolio/me/projects/{project}/members")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void invite(
      @AuthenticationPrincipal Actor a, @PathVariable UUID project, @Valid @RequestBody Invite r) {
    JsonNode mine = project(a.id(), project);
    if (mine == null)
      throw ApiException.invalid("Salve o projeto no portfólio antes de marcar a equipe.");
    var found =
        db.list(
            "SELECT id FROM app_user WHERE lower(username)=lower(?) AND status='ACTIVE'",
            r.username().strip().replaceFirst("^@", ""));
    UUID member = found.isEmpty() ? null : (UUID) found.get(0).get("id");
    // Only a friend can be tagged: nobody gets team invitations from strangers.
    if (member == null
        || member.equals(a.id())
        || !db.exists(
            "SELECT EXISTS(SELECT 1 FROM friendship WHERE status='ACCEPTED' AND"
                + " ((requester=? AND recipient=?) OR (requester=? AND recipient=?)))",
            a.id(),
            member,
            member,
            a.id())) throw ApiException.invalid("Você só pode marcar amigos do Enturma.");
    var existing =
        db.list(
            "SELECT status FROM portfolio_project_member WHERE owner_id=? AND project_id=? AND"
                + " member_id=?",
            a.id(),
            project,
            member);
    if (!existing.isEmpty())
      throw new ApiException(
          409,
          "ALREADY_TAGGED",
          "DECLINED".equals(existing.get(0).get("status"))
              ? "Essa pessoa recusou o convite para este projeto."
              : "Essa pessoa já foi marcada neste projeto.");
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM portfolio_project_member WHERE owner_id=? AND project_id=?",
            Integer.class,
            a.id(),
            project)
        >= MAX_MEMBERS)
      throw ApiException.invalid("Um projeto guarda até " + MAX_MEMBERS + " integrantes.");
    db.jdbc.update(
        "INSERT INTO portfolio_project_member(owner_id,project_id,member_id) VALUES (?,?,?)",
        a.id(),
        project,
        member);
    notifications.send(
        a.id(),
        member,
        "PORTFOLIO_TEAM",
        "friend:portfolio",
        project,
        "/portfolio#equipe",
        name(a.id()) + " marcou você na equipe do projeto " + mine.path("name").asText("") + ".");
  }

  /** The author takes someone off the team, whatever they had answered. */
  @DeleteMapping("/portfolio/me/projects/{project}/members/{member}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void remove(
      @AuthenticationPrincipal Actor a, @PathVariable UUID project, @PathVariable UUID member) {
    if (db.jdbc.update(
            "DELETE FROM portfolio_project_member WHERE owner_id=? AND project_id=? AND"
                + " member_id=?",
            a.id(),
            project,
            member)
        == 0) throw ApiException.missing();
  }

  /** The tagged person accepts or declines, and says what their part was. */
  @PutMapping("/portfolio/team/{owner}/{project}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void answer(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID owner,
      @PathVariable UUID project,
      @Valid @RequestBody Answer r) {
    if (!List.of("ACCEPTED", "DECLINED").contains(r.status()))
      throw ApiException.invalid("Resposta inválida.");
    if (db.jdbc.update(
            "UPDATE portfolio_project_member SET status=?,contribution=?,answered_at=now() WHERE"
                + " owner_id=? AND project_id=? AND member_id=?",
            r.status(),
            r.status().equals("ACCEPTED") ? text(r.contribution()) : "",
            owner,
            project,
            a.id())
        == 0) throw ApiException.missing();
  }

  /** The member leaves the team; their name goes off the author's page. */
  @DeleteMapping("/portfolio/team/{owner}/{project}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void leave(
      @AuthenticationPrincipal Actor a, @PathVariable UUID owner, @PathVariable UUID project) {
    if (db.jdbc.update(
            "DELETE FROM portfolio_project_member WHERE owner_id=? AND project_id=? AND"
                + " member_id=?",
            owner,
            project,
            a.id())
        == 0) throw ApiException.missing();
  }

  /** A member takes the team's project into their own portfolio, with their own part. */
  @Transactional
  @PostMapping("/portfolio/team/{owner}/{project}/copy")
  public Object include(
      @AuthenticationPrincipal Actor a, @PathVariable UUID owner, @PathVariable UUID project)
      throws Exception {
    var member =
        db.list(
            "SELECT contribution FROM portfolio_project_member WHERE owner_id=? AND project_id=?"
                + " AND member_id=? AND status='ACCEPTED'",
            owner,
            project,
            a.id());
    JsonNode origin = project(owner, project);
    if (member.isEmpty() || origin == null) throw ApiException.missing();
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", a.id());
    ArrayNode mine = stored(a.id());
    if (copyOf(mine, owner, project))
      throw new ApiException(409, "ALREADY_THERE", "Este projeto já está no seu portfólio.");
    if (mine.size() >= MAX_PROJECTS)
      throw ApiException.invalid("O portfólio guarda até " + MAX_PROJECTS + " projetos.");
    ObjectNode copy = json.createObjectNode();
    copy.put("id", UUID.randomUUID().toString());
    copy.put("name", origin.path("name").asText(""));
    copy.put("description", origin.path("description").asText(""));
    copy.put("url", origin.path("url").asText(""));
    copy.set("assets", json.createArrayNode());
    // What describes the project comes along; what is the author's own stays with the author.
    for (String key : List.of("kind", "technologies", "subject", "period", "repoUrl"))
      if (origin.has(key)) copy.set(key, origin.get(key));
    copy.put("team", true);
    String part = (String) member.get(0).get("contribution");
    if (!part.isBlank()) copy.put("role", part);
    copy.set(
        "sharedFrom",
        json.createObjectNode().put("userId", owner.toString()).put("projectId", project.toString()));
    mine.add(copy);
    db.jdbc.update(
        "INSERT INTO portfolio_profile(user_id,projects,updated_at) VALUES (?,?::jsonb,now())"
            + " ON CONFLICT(user_id) DO UPDATE SET projects=EXCLUDED.projects,updated_at=now()",
        a.id(),
        json.writeValueAsString(mine));
    return copy;
  }

  /**
   * Adds "members" to each project visitors are about to receive: the people who accepted, and on
   * a member's copy the author too. The portfolio's own owner is never in their own list.
   */
  static void attach(Db db, ObjectMapper json, UUID viewer, Object projects) {
    if (!(projects instanceof ArrayNode list)) return;
    for (JsonNode node : list) {
      if (!(node instanceof ObjectNode project)) continue;
      UUID owner = viewer;
      UUID origin = uuid(project.path("id").asText());
      JsonNode from = project.get("sharedFrom");
      // Visitors learn who the team is, not the ids behind the link.
      project.remove("sharedFrom");
      ArrayNode members = json.createArrayNode();
      project.set("members", members);
      if (from != null) {
        owner = uuid(from.path("userId").asText());
        origin = uuid(from.path("projectId").asText());
        if (owner == null || origin == null) continue;
        JsonNode source = find(db, owner, origin);
        // the copy outlives neither the author's project nor the member's place in it
        if (source == null
            || !db.exists(
                "SELECT EXISTS(SELECT 1 FROM portfolio_project_member WHERE owner_id=? AND"
                    + " project_id=? AND member_id=? AND status='ACCEPTED')",
                owner,
                origin,
                viewer)) continue;
        for (var author :
            db.list(
                "SELECT u.name,u.username," + PUBLIC + " FROM app_user u WHERE u.id=? AND"
                    + " u.status='ACTIVE'",
                owner))
          members.add(person(json, author, source.path("role").asText("")));
      }
      if (origin == null) continue;
      for (var row :
          db.list(
              "SELECT u.name,u.username,m.contribution," + PUBLIC + " FROM app_user u"
                  + " JOIN portfolio_project_member m ON m.member_id=u.id WHERE m.owner_id=? AND"
                  + " m.project_id=? AND m.status='ACCEPTED' AND m.member_id<>? AND"
                  + " u.status='ACTIVE' ORDER BY m.answered_at",
              owner,
              origin,
              viewer)) members.add(person(json, row, (String) row.get("contribution")));
    }
  }

  private static final String PUBLIC =
      "EXISTS(SELECT 1 FROM portfolio_profile p WHERE p.user_id=u.id AND p.public) portfolio";

  private static ObjectNode person(ObjectMapper json, Map<String, Object> row, String part) {
    ObjectNode out = json.createObjectNode();
    out.put("name", (String) row.get("name"));
    out.put("username", (String) row.get("username"));
    out.put("contribution", part == null ? "" : part);
    // only a public portfolio can be linked to
    out.put("portfolio", Boolean.TRUE.equals(row.get("portfolio")));
    return out;
  }

  /** A saved project that is still on show to its owner's visitors; null otherwise. */
  private JsonNode project(UUID owner, UUID id) {
    return find(db, owner, id);
  }

  private static JsonNode find(Db db, UUID owner, UUID id) {
    var rows = db.list("SELECT projects FROM portfolio_profile WHERE user_id=?", owner);
    if (rows.isEmpty() || !(rows.get(0).get("projects") instanceof JsonNode list)) return null;
    for (JsonNode project : list)
      if (project.path("id").asText().equals(id.toString()))
        return project.path("archived").asBoolean(false) ? null : project;
    return null;
  }

  private ArrayNode stored(UUID user) {
    var rows = db.list("SELECT projects FROM portfolio_profile WHERE user_id=?", user);
    return rows.isEmpty() || !(rows.get(0).get("projects") instanceof ArrayNode list)
        ? json.createArrayNode()
        : list;
  }

  private static boolean copyOf(JsonNode projects, UUID owner, UUID project) {
    for (JsonNode mine : projects)
      if (mine.path("sharedFrom").path("userId").asText().equals(owner.toString())
          && mine.path("sharedFrom").path("projectId").asText().equals(project.toString()))
        return true;
    return false;
  }

  private String name(UUID user) {
    return db.jdbc.queryForObject("SELECT name FROM app_user WHERE id=?", String.class, user);
  }

  private static UUID uuid(String value) {
    try {
      return UUID.fromString(value);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }

  private static String text(String value) {
    String clean = value == null ? "" : value.strip();
    return clean.length() <= 300 ? clean : clean.substring(0, 300).stripTrailing();
  }
}
