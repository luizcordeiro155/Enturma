package br.com.enturma.learning;

import br.com.enturma.ai.AiProvider;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/practice")
public class AdaptivePracticeController {
  private final Db db;
  private final AiProvider ai;
  private final ObjectMapper json;

  public AdaptivePracticeController(Db db, AiProvider ai, ObjectMapper json) {
    this.db = db;
    this.ai = ai;
    this.json = json;
  }

  public record Generate(UUID subjectId, @Size(max = 160) String topic, @Min(3) @Max(10) int questions) {}
  public record AnswerItem(@NotNull UUID questionId, @Min(0) @Max(7) int selectedIndex) {}
  public record Submit(@NotEmpty @Size(max = 10) List<@Valid AnswerItem> answers) {}

  @GetMapping("/diagnostic")
  public Object diagnostic(@AuthenticationPrincipal Actor a) {
    var topics =
        db.list(
            "SELECT q.topic,count(*) attempts,count(*) FILTER(WHERE x.correct) correct,"
                + " round(100.0*count(*) FILTER(WHERE x.correct)/greatest(count(*),1),1) accuracy"
                + " FROM practice_attempt x JOIN practice_question q ON q.id=x.question_id"
                + " WHERE x.user_id=? GROUP BY q.topic ORDER BY accuracy ASC,attempts DESC LIMIT 12",
            a.id());
    var totals =
        db.one(
            "SELECT count(*) attempts,count(*) FILTER(WHERE correct) correct"
                + " FROM practice_attempt WHERE user_id=?",
            a.id());
    return Map.of("topics", topics, "totals", totals);
  }

  @PostMapping("/generate")
  @Transactional
  public Object generate(@AuthenticationPrincipal Actor a, @Valid @RequestBody Generate r) {
    if (!ai.enabled())
      throw new ApiException(503, "AI_UNAVAILABLE", "A Enturma AI ainda não está disponível.");
    if (r.subjectId() != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=? AND subject_id=?)",
            a.id(),
            r.subjectId()))
      throw ApiException.invalid("Selecione esta matéria no perfil primeiro.");

    String subject =
        r.subjectId() == null
            ? "estudos gerais"
            : Objects.toString(
                db.one("SELECT name FROM academic_entry WHERE id=?", r.subjectId()).get("name"),
                "estudos gerais");
    var weak =
        db.list(
            "SELECT q.topic,round(100.0*count(*) FILTER(WHERE x.correct)/greatest(count(*),1),1) accuracy"
                + " FROM practice_attempt x JOIN practice_question q ON q.id=x.question_id"
                + " WHERE x.user_id=? GROUP BY q.topic HAVING count(*)>=2 ORDER BY accuracy ASC LIMIT 4",
            a.id());
    String weakText =
        weak.stream()
            .map(v -> v.get("topic") + " (" + v.get("accuracy") + "%)")
            .toList()
            .toString();
    String topic = Objects.toString(r.topic(), "").strip();
    int count = Math.clamp(r.questions(), 3, 10);
    String prompt =
        "Crie "
            + count
            + " questões de múltipla escolha para "
            + subject
            + (topic.isBlank() ? "" : ", com foco em " + topic)
            + ". Dificuldades anteriores do aluno: "
            + weakText
            + ". Adapte a dificuldade gradualmente. Retorne SOMENTE JSON válido no formato "
            + "{\"title\":\"...\",\"questions\":[{\"topic\":\"...\",\"prompt\":\"...\","
            + "\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answerIndex\":0,"
            + "\"explanation\":\"...\",\"difficulty\":1}]}. Sem markdown.";

    String raw = ai.answer("", prompt, "ADAPTIVE_QUIZ", false).text().strip();
    try {
      JsonNode root = json.readTree(raw);
      JsonNode questions = root.path("questions");
      if (!questions.isArray() || questions.isEmpty()) throw new IllegalArgumentException();

      UUID session = UUID.randomUUID();
      String title = root.path("title").asText("Prática adaptativa").strip();
      if (title.length() > 180) title = title.substring(0, 180);
      db.jdbc.update(
          "INSERT INTO practice_session(id,user_id,subject_id,title,focus_topics)"
              + " VALUES (?,?,?,?,?::jsonb)",
          session,
          a.id(),
          r.subjectId(),
          title,
          json.writeValueAsString(weak));

      List<Map<String, Object>> publicQuestions = new ArrayList<>();
      int added = 0;
      for (JsonNode q : questions) {
        if (added >= count) break;
        JsonNode opts = q.path("options");
        int answer = q.path("answerIndex").asInt(-1);
        if (!opts.isArray()
            || opts.size() < 2
            || opts.size() > 8
            || answer < 0
            || answer >= opts.size()) continue;
        String qp = q.path("prompt").asText("").strip();
        String explanation = q.path("explanation").asText("").strip();
        String qt = q.path("topic").asText("Geral").strip();
        int difficulty = Math.clamp(q.path("difficulty").asInt(2), 1, 5);
        if (qp.isBlank() || explanation.isBlank()) continue;

        UUID id = UUID.randomUUID();
        db.jdbc.update(
            "INSERT INTO practice_question(id,session_id,topic,prompt,options,answer_index,explanation,difficulty)"
                + " VALUES (?,?,?,?,?::jsonb,?,?,?)",
            id,
            session,
            qt.substring(0, Math.min(qt.length(), 120)),
            qp.substring(0, Math.min(qp.length(), 1800)),
            json.writeValueAsString(opts),
            answer,
            explanation.substring(0, Math.min(explanation.length(), 2400)),
            difficulty);
        publicQuestions.add(
            Map.of(
                "id", id,
                "topic", qt,
                "prompt", qp,
                "options", json.convertValue(opts, List.class),
                "difficulty", difficulty));
        added++;
      }
      if (publicQuestions.size() < 3) throw new IllegalArgumentException();
      return Map.of("id", session, "title", title, "questions", publicQuestions);
    } catch (Exception e) {
      throw new ApiException(
          503, "AI_FORMAT", "A IA não conseguiu montar um simulado válido. Tente novamente.");
    }
  }

  @PostMapping("/{session}/submit")
  @Transactional
  public Object submit(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID session,
      @Valid @RequestBody Submit r) {
    db.one("SELECT id FROM practice_session WHERE id=? AND user_id=?", session, a.id());
    List<Map<String, Object>> results = new ArrayList<>();
    int correct = 0;
    for (AnswerItem item : r.answers()) {
      var q =
          db.one(
              "SELECT id,topic,answer_index,explanation FROM practice_question"
                  + " WHERE id=? AND session_id=?",
              item.questionId(),
              session);
      boolean ok = ((Number) q.get("answerIndex")).intValue() == item.selectedIndex();
      if (ok) correct++;
      db.jdbc.update(
          "INSERT INTO practice_attempt(question_id,user_id,selected_index,correct)"
              + " VALUES (?,?,?,?) ON CONFLICT(question_id,user_id) DO UPDATE SET"
              + " selected_index=EXCLUDED.selected_index,correct=EXCLUDED.correct,created_at=now()",
          item.questionId(),
          a.id(),
          item.selectedIndex(),
          ok);
      results.add(
          Map.of(
              "questionId", item.questionId(),
              "correct", ok,
              "topic", q.get("topic"),
              "explanation", q.get("explanation")));
    }

    var weak =
        db.list(
            "SELECT q.topic,count(*) attempts,count(*) FILTER(WHERE x.correct) correct,"
                + " round(100.0*count(*) FILTER(WHERE x.correct)/greatest(count(*),1),1) accuracy"
                + " FROM practice_attempt x JOIN practice_question q ON q.id=x.question_id"
                + " WHERE x.user_id=? GROUP BY q.topic ORDER BY accuracy ASC LIMIT 6",
            a.id());
    return Map.of(
        "correct", correct,
        "total", r.answers().size(),
        "results", results,
        "weakTopics", weak);
  }

  @PostMapping("/notebooks/{notebook}/flashcards")
  @Transactional
  public Object notebookFlashcards(
      @AuthenticationPrincipal Actor a, @PathVariable UUID notebook) {
    db.one("SELECT id FROM study_notebook WHERE id=? AND user_id=?", notebook, a.id());
    var sources =
        db.list(
            "SELECT title,content FROM notebook_source WHERE notebook_id=? AND status='READY'"
                + " ORDER BY created_at LIMIT 10",
            notebook);
    if (sources.isEmpty()) throw ApiException.invalid("Adicione ao menos uma fonte pronta.");

    StringBuilder context = new StringBuilder();
    for (var s : sources) {
      context.append("\nFONTE: ").append(s.get("title")).append("\n");
      String value = Objects.toString(s.get("content"), "");
      context.append(value, 0, Math.min(value.length(), 6000));
      if (context.length() > 30000) break;
    }
    String raw =
        ai.answer(
                context.toString(),
                "Crie entre 8 e 15 flashcards de recuperação ativa. Retorne SOMENTE JSON válido"
                    + " como {\"cards\":[{\"front\":\"pergunta\",\"back\":\"resposta objetiva\"}]}"
                    + ". Sem markdown.",
                "FLASHCARDS_STRUCTURED",
                false)
            .text()
            .strip();
    try {
      JsonNode cards = json.readTree(raw).path("cards");
      if (!cards.isArray() || cards.isEmpty()) throw new IllegalArgumentException();
      int count = 0;
      for (JsonNode card : cards) {
        if (count >= 15) break;
        String front = card.path("front").asText("").strip();
        String back = card.path("back").asText("").strip();
        if (front.isBlank() || back.isBlank()) continue;
        db.jdbc.update(
            "INSERT INTO study_flashcard(id,user_id,notebook_id,front,back) VALUES (?,?,?,?,?)",
            UUID.randomUUID(),
            a.id(),
            notebook,
            front.substring(0, Math.min(front.length(), 1200)),
            back.substring(0, Math.min(back.length(), 2400)));
        count++;
      }
      if (count == 0) throw new IllegalArgumentException();
      return Map.of("created", count);
    } catch (Exception e) {
      throw new ApiException(
          503,
          "AI_FORMAT",
          "Não foi possível transformar este caderno em flashcards agora.");
    }
  }
}
