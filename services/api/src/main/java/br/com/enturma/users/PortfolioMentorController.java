package br.com.enturma.users;

import br.com.enturma.ai.AiProvider;
import br.com.enturma.ai.AiQuota;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Helps a student word one project. It is given the draft of that project and nothing else of
 * the account, it only returns text for the student to accept or not, and it never saves.
 */
@RestController
@RequestMapping("/api/v1")
public class PortfolioMentorController {
  private final AiProvider provider;
  private final AiQuota quota;
  private final ObjectMapper json;

  public PortfolioMentorController(AiProvider provider, AiQuota quota, ObjectMapper json) {
    this.provider = provider;
    this.quota = quota;
    this.json = json;
  }

  /** What the student has written about the project so far. */
  public record Draft(
      @NotBlank @Size(max = 120) String name,
      @Size(max = 500) String description,
      @Size(max = 12) List<@Size(max = 40) String> technologies,
      @Size(max = 120) String subject,
      Boolean team,
      @Size(max = 300) String role,
      @Size(max = 300) String outcome,
      @Size(max = 200) String goal) {}

  @GetMapping("/portfolio/mentor")
  public Object available() {
    return Map.of("available", provider.enabled());
  }

  @PostMapping("/portfolio/me/mentor")
  public Object suggest(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Draft draft) {
    String name = text(draft.name());
    String description = text(draft.description());
    if (name.isEmpty() || description.length() < 12)
      throw ApiException.invalid(
          "Escreva o nome e pelo menos uma frase sobre o projeto para o mentor ter de onde"
              + " partir.");
    if (!provider.enabled())
      throw new ApiException(
          503, "MENTOR_UNAVAILABLE", "O mentor do portfólio está indisponível no momento.");
    quota.consume(actor);

    var lines = new ArrayList<String>();
    lines.add("RASCUNHO DO ESTUDANTE");
    lines.add("Nome do projeto: " + name);
    lines.add("Descrição: " + description);
    if (draft.technologies() != null && !draft.technologies().isEmpty())
      lines.add(
          "Tecnologias: "
              + String.join(
                  ", ", draft.technologies().stream().filter(v -> v != null).toList()));
    add(lines, "Disciplina", draft.subject());
    lines.add("Feito em equipe: " + (Boolean.TRUE.equals(draft.team()) ? "sim" : "não informado"));
    add(lines, "Parte do estudante", draft.role());
    add(lines, "Resultado", draft.outcome());
    add(lines, "Objetivo profissional do estudante", draft.goal());

    var answer = provider.answer("", String.join("\n", lines), "PORTFOLIO_MENTOR", false);
    JsonNode reply = parse(answer == null ? null : answer.text());
    var out = new LinkedHashMap<String, Object>();
    out.put("description", clamp(reply.path("description").asText(""), 500));
    // The mentor rewords what is there. A part or a result the student never wrote is not
    // offered, whatever came back: that would be the mentor's invention, not their project.
    if (!text(draft.role()).isEmpty())
      out.put("role", clamp(reply.path("role").asText(""), 300));
    if (!text(draft.outcome()).isEmpty())
      out.put("outcome", clamp(reply.path("outcome").asText(""), 300));
    out.put("caseStudy", clamp(reply.path("caseStudy").asText(""), 1500));
    var questions = new ArrayList<String>();
    for (JsonNode question : reply.path("questions")) {
      String value = clamp(question.asText(""), 200);
      if (!value.isEmpty() && questions.size() < 4) questions.add(value);
    }
    out.put("questions", questions);
    out.values().removeIf(value -> value instanceof String text && text.isEmpty());
    if (!out.containsKey("description") && !out.containsKey("caseStudy") && questions.isEmpty())
      throw unusable();
    return out;
  }

  private JsonNode parse(String reply) {
    if (reply == null) throw unusable();
    int from = reply.indexOf('{');
    int to = reply.lastIndexOf('}');
    if (from < 0 || to <= from) throw unusable();
    try {
      return json.readTree(reply.substring(from, to + 1));
    } catch (Exception e) {
      throw unusable();
    }
  }

  private static ApiException unusable() {
    return new ApiException(
        502, "MENTOR_EMPTY", "O mentor não conseguiu montar uma sugestão agora. Tente de novo.");
  }

  private static void add(List<String> lines, String label, String value) {
    if (!text(value).isEmpty()) lines.add(label + ": " + text(value));
  }

  private static String text(String value) {
    return value == null ? "" : value.strip();
  }

  private static String clamp(String value, int max) {
    String clean = text(value);
    return clean.length() <= max ? clean : clean.substring(0, max).stripTrailing();
  }
}
