package br.com.enturma.campus;

import br.com.enturma.ai.AiProvider;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import br.com.enturma.notifications.AppChanged;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/campus/tutor")
public class CampusTutorController {
  private final Db db;
  private final AiProvider ai;
  private final ApplicationEventPublisher events;

  public CampusTutorController(Db db, AiProvider ai, ApplicationEventPublisher events) {
    this.db = db;
    this.ai = ai;
    this.events = events;
  }

  public record TutorRequest(
      UUID subjectId,
      UUID focusSessionId,
      @Size(max = 600) String goal,
      @NotBlank @Size(max = 2000) String message,
      @Size(max = 24) String action) {}

  public record FeedbackRequest(
      @Min(1) @Max(5) int rating,
      @Size(max = 400) String preference) {}

  @GetMapping("/profile")
  public Object profile(@AuthenticationPrincipal Actor actor) {
    ensureProfile(actor.id());
    var profile =
        db.one(
            "SELECT learning_notes,interaction_count,helpful_count,updated_at"
                + " FROM campus_learning_profile WHERE user_id=?",
            actor.id());
    profile.put(
        "recent",
        db.list(
            "SELECT id,action,prompt,response,rating,created_at"
                + " FROM campus_tutor_interaction WHERE user_id=?"
                + " ORDER BY created_at DESC LIMIT 6",
            actor.id()));
    return profile;
  }

  @PostMapping
  @Transactional
  public Object tutor(
      @AuthenticationPrincipal Actor actor, @Valid @RequestBody TutorRequest request) {
    if (!ai.enabled())
      throw new ApiException(
          503, "AI_UNAVAILABLE", "A Enturma AI ainda não está disponível.");

    ensureProfile(actor.id());
    String action = normalizeAction(request.action());
    String subjectName = "Estudo geral";

    if (request.subjectId() != null) {
      if (!db.exists(
          "SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=? AND subject_id=?)",
          actor.id(),
          request.subjectId()))
        throw ApiException.invalid("Selecione esta matéria no seu perfil primeiro.");
      subjectName =
          Objects.toString(
              db.one("SELECT name FROM academic_entry WHERE id=?", request.subjectId()).get("name"),
              "Matéria");
    }

    if (request.focusSessionId() != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM focus_session"
                + " WHERE id=? AND user_id=? AND finished_at IS NULL)",
            request.focusSessionId(),
            actor.id()))
      throw ApiException.invalid("A sessão de foco não está ativa.");

    var learning =
        db.one(
            "SELECT learning_notes,interaction_count,helpful_count"
                + " FROM campus_learning_profile WHERE user_id=?",
            actor.id());
    var practice =
        db.one(
            "SELECT count(*) attempts,count(*) FILTER(WHERE correct) correct"
                + " FROM practice_attempt WHERE user_id=?",
            actor.id());
    var recent =
        db.list(
            "SELECT action,prompt,response,rating FROM campus_tutor_interaction"
                + " WHERE user_id=? ORDER BY created_at DESC LIMIT 6",
            actor.id());

    StringBuilder history = new StringBuilder();
    List<Map<String, Object>> chronological = new ArrayList<>(recent);
    Collections.reverse(chronological);
    for (var row : chronological) {
      history
          .append("\n- ")
          .append(row.get("action"))
          .append(": ")
          .append(limit(Objects.toString(row.get("prompt"), ""), 280))
          .append("\n  Tutor: ")
          .append(limit(Objects.toString(row.get("response"), ""), 480));
      if (row.get("rating") != null)
        history.append(" [nota ").append(row.get("rating")).append("/5]");
    }

    String context =
        "CONTEXTO PEDAGOGICO DO ALUNO\n"
            + "Materia atual: "
            + subjectName
            + "\nObjetivo da sessao: "
            + Objects.toString(request.goal(), "Compreender e praticar o conteudo")
            + "\nMemoria adaptativa: "
            + learning.get("learningNotes")
            + "\nPratica acumulada: "
            + practice.get("correct")
            + " acertos em "
            + practice.get("attempts")
            + " tentativas.\nInteracoes recentes:"
            + (history.isEmpty() ? " nenhuma ainda." : history)
            + "\n\nREGRAS DE TUTORIA: ensine ativamente, cheque entendimento, use exemplos curtos,"
            + " mude a forma de explicar quando houver sinais de dificuldade e nao entregue apenas uma resposta."
            + " Para TEST, faca uma pergunta por vez e espere a tentativa do aluno."
            + " Para SIMPLIFY, reduza a complexidade sem perder precisao."
            + " Para EXAMPLE, conecte o conceito a um exemplo concreto."
            + " Para FLASHCARD, ajude a recuperar da memoria antes de revelar a resposta.";

    String question =
        "Acao pedagogica: "
            + action
            + "\nPedido do aluno: "
            + request.message()
            + "\nResponda em pt-BR, de forma dialogada e adequada ao perfil acima.";

    AiProvider.Answer answer = ai.answer(context, question, "CAMPUS_TUTOR", false);
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO campus_tutor_interaction"
            + "(id,user_id,subject_id,focus_session_id,action,prompt,response)"
            + " VALUES (?,?,?,?,?,?,?)",
        id,
        actor.id(),
        request.subjectId(),
        request.focusSessionId(),
        action,
        request.message().strip(),
        limit(answer.text(), 8000));

    db.jdbc.update(
        "UPDATE campus_learning_profile"
            + " SET interaction_count=interaction_count+1,updated_at=now() WHERE user_id=?",
        actor.id());

    events.publishEvent(new AppChanged("campus_changed", Set.of(actor.id())));

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("id", id);
    out.put("text", answer.text());
    out.put("model", Objects.toString(answer.model(), ""));
    out.put("action", action);
    out.put("learningNotes", learning.get("learningNotes"));
    return out;
  }

  @PostMapping("/{id}/feedback")
  @Transactional
  public void feedback(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID id,
      @Valid @RequestBody FeedbackRequest request) {
    int changed =
        db.jdbc.update(
            "UPDATE campus_tutor_interaction SET rating=? WHERE id=? AND user_id=?",
            request.rating(),
            id,
            actor.id());
    if (changed == 0) throw ApiException.missing();

    String preference = Objects.toString(request.preference(), "").strip();
    String signal;
    if (!preference.isBlank()) signal = preference;
    else if (request.rating() <= 2)
      signal =
          "Quando houver dificuldade, prefira passos menores, linguagem simples e um exemplo antes de testar.";
    else if (request.rating() >= 4)
      signal =
          "O formato recente funcionou bem; preserve a clareza e aumente a dificuldade gradualmente.";
    else signal = "Use explicacao curta, exemplo e uma checagem de entendimento.";

    db.jdbc.update(
        "UPDATE campus_learning_profile SET learning_notes=left("
            + "CASE WHEN learning_notes='Perfil adaptativo em formação.' THEN ?"
            + " ELSE learning_notes || E'\\n' || ? END,3000),"
            + " helpful_count=helpful_count+CASE WHEN ?>=4 THEN 1 ELSE 0 END,"
            + " updated_at=now() WHERE user_id=?",
        signal,
        signal,
        request.rating(),
        actor.id());

    events.publishEvent(new AppChanged("campus_changed", Set.of(actor.id())));
  }

  private void ensureProfile(UUID user) {
    db.jdbc.update(
        "INSERT INTO campus_learning_profile(user_id) VALUES (?) ON CONFLICT DO NOTHING", user);
  }

  private String normalizeAction(String value) {
    String action = Objects.toString(value, "EXPLAIN").strip().toUpperCase(Locale.ROOT);
    return Set.of("EXPLAIN", "SIMPLIFY", "EXAMPLE", "TEST", "FLASHCARD", "PLAN").contains(action)
        ? action
        : "EXPLAIN";
  }

  private String limit(String value, int max) {
    if (value == null) return "";
    return value.length() <= max ? value : value.substring(0, max);
  }
}
