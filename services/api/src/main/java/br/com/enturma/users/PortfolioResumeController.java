package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The student's résumé choices. The résumé itself is put together on the page from the
 * portfolio; what is kept here is which model, what goes in, and the contact details. It is the
 * student's alone: there is no public route to it.
 */
@RestController
@RequestMapping("/api/v1")
public class PortfolioResumeController {
  private static final Set<String> TEMPLATES = Set.of("INTERNSHIP", "FIRST_JOB", "ACADEMIC", "TECH");
  private static final Set<String> LOOKS = Set.of("PLAIN", "ACCENT");

  private final Db db;
  private final ObjectMapper json;

  public PortfolioResumeController(Db db, ObjectMapper json) {
    this.db = db;
    this.json = json;
  }

  public record Contact(
      @Size(max = 160) String email,
      @Size(max = 40) String phone,
      @Size(max = 80) String city,
      @Size(max = 200) String linkedin,
      @Size(max = 200) String github,
      @Size(max = 200) String site) {}

  public record Education(
      @Size(max = 120) String course,
      @Size(max = 160) String institution,
      @Size(max = 60) String period) {}

  public record Resume(
      @Size(max = 20) String template,
      @Size(max = 12) String look,
      @Valid Contact contact,
      @Size(max = 200) String objective,
      @Size(max = 1200) String summary,
      @Size(max = 4) List<@Valid Education> education,
      @Size(max = 12) List<UUID> projects,
      @Size(max = 40) List<UUID> journey,
      @Size(max = 30) List<@Size(max = 60) String> skills) {}

  /** Empty until the student saves a résumé for the first time. */
  @GetMapping("/portfolio/me/resume")
  public Object mine(@AuthenticationPrincipal Actor a) {
    var rows = db.list("SELECT data FROM portfolio_resume WHERE user_id=?", a.id());
    return rows.isEmpty() ? Map.of() : rows.get(0).get("data");
  }

  @PutMapping("/portfolio/me/resume")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void save(@AuthenticationPrincipal Actor a, @Valid @RequestBody Resume r)
      throws Exception {
    String template = r.template() == null ? "INTERNSHIP" : r.template();
    String look = r.look() == null ? "PLAIN" : r.look();
    if (!TEMPLATES.contains(template) || !LOOKS.contains(look))
      throw ApiException.invalid("Escolha um modelo de currículo válido.");
    var out = new LinkedHashMap<String, Object>();
    out.put("template", template);
    out.put("look", look);
    Contact c = r.contact() == null ? new Contact(null, null, null, null, null, null) : r.contact();
    var contact = new LinkedHashMap<String, Object>();
    contact.put("email", text(c.email()));
    contact.put("phone", text(c.phone()));
    contact.put("city", text(c.city()));
    contact.put("linkedin", link(c.linkedin()));
    contact.put("github", link(c.github()));
    contact.put("site", link(c.site()));
    out.put("contact", contact);
    out.put("objective", text(r.objective()));
    out.put("summary", text(r.summary()));
    var education = new ArrayList<Map<String, Object>>();
    for (var item : r.education() == null ? List.<Education>of() : r.education()) {
      if (item == null || (text(item.course()).isEmpty() && text(item.institution()).isEmpty()))
        continue;
      var row = new LinkedHashMap<String, Object>();
      row.put("course", text(item.course()));
      row.put("institution", text(item.institution()));
      row.put("period", text(item.period()));
      education.add(row);
    }
    out.put("education", education);
    out.put("projects", distinct(r.projects()));
    out.put("journey", distinct(r.journey()));
    var skills = new ArrayList<String>();
    var seen = new LinkedHashSet<String>();
    for (String skill : r.skills() == null ? List.<String>of() : r.skills())
      if (skill != null && !skill.isBlank() && seen.add(skill.strip().toLowerCase()))
        skills.add(skill.strip());
    out.put("skills", skills);
    db.jdbc.update(
        "INSERT INTO portfolio_resume(user_id,data,updated_at) VALUES (?,?::jsonb,now())"
            + " ON CONFLICT(user_id) DO UPDATE SET data=EXCLUDED.data,updated_at=now()",
        a.id(),
        json.writeValueAsString(out));
  }

  private static List<UUID> distinct(List<UUID> ids) {
    return ids == null ? List.of() : ids.stream().filter(Objects::nonNull).distinct().toList();
  }

  private static String text(String value) {
    return value == null ? "" : value.strip();
  }

  /** Links print on the résumé and are clicked in the PDF: only web addresses pass. */
  private static String link(String value) {
    String clean = text(value);
    if (clean.isEmpty()) return "";
    try {
      URI uri = URI.create(clean);
      if (uri.getHost() != null && List.of("http", "https").contains(uri.getScheme()))
        return clean;
    } catch (IllegalArgumentException ignored) {
      // falls through to the message below
    }
    throw ApiException.invalid("Use links completos, começando com https://.");
  }
}
