package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.auth.ExternalIdentityGateway;
import br.com.enturma.auth.ExternalIdentityGateway.Repository;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * The connected GitHub account in the portfolio. With automatic import on, public repositories the
 * student owns enter the portfolio by themselves — each one once, so a project the student removed
 * stays removed.
 */
@Service
@RestController
@RequestMapping("/api/v1/portfolio/me/github")
public class PortfolioGithub {
  private static final int MAX_PROJECTS = 60;
  /** How many repositories one check may bring, the most recently worked on first. */
  private static final int MAX_ADDED = 12;
  private static final int MAX_SEEN = 300;
  private static final java.util.regex.Pattern REPOSITORY =
      java.util.regex.Pattern.compile("[A-Za-z0-9-]{1,39}/[A-Za-z0-9._-]{1,100}");

  private final Db db;
  private final ObjectMapper json;
  private final ExternalIdentityGateway gateway;

  public PortfolioGithub(Db db, ObjectMapper json, ExternalIdentityGateway gateway) {
    this.db = db;
    this.json = json;
    this.gateway = gateway;
  }

  /** The connected account and whether it imports by itself; null when none is connected. */
  public Map<String, Object> status(UUID user) {
    return db
        .list(
            "SELECT i.login,coalesce(p.github_auto,false) auto FROM user_identity i LEFT JOIN"
                + " portfolio_profile p ON p.user_id=i.user_id WHERE i.user_id=? AND"
                + " i.provider='GITHUB'",
            user)
        .stream()
        .findFirst()
        .orElse(null);
  }

  public record Auto(boolean auto) {}

  /** Turns automatic import on or off. Turning it on brings what is there now. */
  @PutMapping
  @Transactional
  public Map<String, Object> auto(@AuthenticationPrincipal Actor a, @RequestBody Auto body) {
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", a.id());
    if (status(a.id()) == null)
      throw new ApiException(
          409, "GITHUB_NOT_CONNECTED", "Conecte sua conta do GitHub antes de ligar a importação.");
    db.jdbc.update(
        "INSERT INTO portfolio_profile(user_id,github_auto) VALUES (?,?) ON CONFLICT(user_id) DO"
            + " UPDATE SET github_auto=EXCLUDED.github_auto",
        a.id(),
        body.auto());
    int added = body.auto() ? sync(a.id(), true) : 0;
    var out = new LinkedHashMap<>(status(a.id()));
    out.put("added", Math.max(0, added));
    // false when GitHub did not answer: the choice is kept and the check happens later
    out.put("reached", added >= 0);
    return out;
  }

  /** Looks for new repositories when the student opens the portfolio, at most once an hour. */
  @Transactional
  public int refresh(UUID user) {
    return Math.max(0, sync(user, false));
  }

  /** How many projects came in; -1 when GitHub could not be reached. */
  private int sync(UUID user, boolean now) {
    var rows =
        db.list(
            "SELECT p.projects,p.github_seen,i.login FROM portfolio_profile p JOIN user_identity i"
                + " ON i.user_id=p.user_id AND i.provider='GITHUB' WHERE p.user_id=? AND"
                + " p.github_auto AND (? OR p.github_synced_at IS NULL OR"
                + " p.github_synced_at<now()-interval '1 hour') FOR UPDATE OF p",
            user,
            now);
    if (rows.isEmpty()) return 0;
    var row = rows.getFirst();
    List<Repository> repositories = null;
    try {
      repositories = gateway.repositories((String) row.get("login"));
    } catch (RuntimeException e) {
      // handled below, with the answer that never came
    }
    if (repositories == null) {
      // An outage is not asked about on every visit: the next try is in ten minutes.
      db.jdbc.update(
          "UPDATE portfolio_profile SET github_synced_at=now()-interval '50 minutes' WHERE"
              + " user_id=?",
          user);
      return -1;
    }

    ArrayNode projects =
        row.get("projects") instanceof ArrayNode stored ? stored : json.createArrayNode();
    var known = new HashSet<String>();
    for (JsonNode project : projects) {
      known.add(project.path("github").path("fullName").asText("").toLowerCase(Locale.ROOT));
      known.add(
          project
              .path("repoUrl")
              .asText("")
              .replaceFirst("(?i)^https?://github\\.com/", "")
              .replaceFirst("/+$", "")
              .toLowerCase(Locale.ROOT));
    }
    var seen = new LinkedHashSet<String>();
    if (row.get("githubSeen") instanceof String[] before) seen.addAll(Arrays.asList(before));
    int added = 0;
    for (Repository repository : repositories) {
      String fullName = Objects.toString(repository.fullName(), "");
      if (!REPOSITORY.matcher(fullName).matches()) continue;
      String key = fullName.toLowerCase(Locale.ROOT);
      // Offered once: later the student decides by hand what happens to it.
      boolean fresh = seen.add(key);
      if (!fresh || known.contains(key) || repository.fork() || repository.archived()) continue;
      if (added >= MAX_ADDED || projects.size() >= MAX_PROJECTS) continue;
      projects.add(project(repository, fullName));
      added++;
    }
    var kept = new ArrayList<>(seen);
    if (kept.size() > MAX_SEEN) kept = new ArrayList<>(kept.subList(kept.size() - MAX_SEEN, kept.size()));
    try {
      db.jdbc.update(
          "UPDATE portfolio_profile SET projects=?::jsonb,github_seen=?,github_synced_at=now(),"
              + "updated_at=CASE WHEN ? THEN now() ELSE updated_at END WHERE user_id=?",
          json.writeValueAsString(projects),
          kept.toArray(String[]::new),
          added > 0,
          user);
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
      throw new IllegalStateException(e);
    }
    return added;
  }

  /** The same draft the student gets when choosing a repository by hand. */
  private JsonNode project(Repository repository, String fullName) {
    var project = json.createObjectNode();
    project.put("id", UUID.randomUUID().toString());
    project.put("name", cut(repository.name().isBlank() ? fullName : repository.name(), 120));
    project.put("description", cut(repository.description(), 500));
    project.put("url", link(repository.homepage()));
    project.putArray("assets");
    project.put("kind", "PERSONAL");
    var technologies = project.putArray("technologies");
    var labels = new LinkedHashMap<String, String>();
    var named = new ArrayList<String>();
    named.add(Objects.toString(repository.language(), ""));
    if (repository.topics() != null) named.addAll(repository.topics());
    for (String label : named) {
      if (label == null || label.isBlank() || label.strip().length() > 40) continue;
      labels.putIfAbsent(label.strip().toLowerCase(Locale.ROOT), label.strip());
    }
    labels.values().stream().limit(12).forEach(technologies::add);
    if (technologies.isEmpty()) project.remove("technologies");
    project.put("repoUrl", "https://github.com/" + fullName);
    var github = project.putObject("github");
    github.put("fullName", fullName);
    github.put("stars", Math.max(0, repository.stars()));
    if (repository.pushedAt() != null && !repository.pushedAt().isBlank())
      github.put("updatedAt", cut(repository.pushedAt(), 40));
    return project;
  }

  private static String cut(String value, int max) {
    String text = value == null ? "" : value.strip();
    return text.length() > max ? text.substring(0, max).strip() : text;
  }

  private static String link(String value) {
    String text = value == null ? "" : value.strip();
    if (text.length() > 300 || !text.matches("(?i)https?://\\S+")) return "";
    try {
      var uri = java.net.URI.create(text);
      return uri.getHost() == null || uri.getUserInfo() != null ? "" : text;
    } catch (IllegalArgumentException e) {
      return "";
    }
  }
}
