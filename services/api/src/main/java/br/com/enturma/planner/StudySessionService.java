package br.com.enturma.planner;

import br.com.enturma.ai.NotebookService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.planner.PlannerService.PlannerChanged;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Study sessions scheduled on the calendar. Each one owns a study notebook where the AI tutor
 * talks with the student (through {@link NotebookService}), generates quizzes and, once the
 * student gets every answer right, closes the session. Mastery per subject adapts the tutor.
 */
@Service
public class StudySessionService {
  public record NewSession(UUID subjectId, OffsetDateTime startsAt, Integer minutes, String goal) {}

  private static final Set<String> PERSONALITIES = Set.of("WELCOMING", "BALANCED", "DEMANDING");
  private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM");
  private final Db db;
  private final NotebookService notebooks;
  private final PlannerService planner;
  private final ObjectMapper json;
  private final ApplicationEventPublisher events;

  public StudySessionService(
      Db db,
      NotebookService notebooks,
      PlannerService planner,
      ObjectMapper json,
      ApplicationEventPublisher events) {
    this.db = db;
    this.notebooks = notebooks;
    this.planner = planner;
    this.json = json;
    this.events = events;
  }

  // ---------------------------------------------------------------- scheduling

  @Transactional
  public UUID create(Actor a, NewSession s) {
    if (s.subjectId() == null
        || !db.exists(
            "SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=? AND subject_id=?)",
            a.id(),
            s.subjectId())) throw ApiException.invalid("Escolha uma das matérias do seu perfil acadêmico.");
    validate(s.startsAt(), s.minutes());
    String subject =
        db.jdbc.queryForObject("SELECT name FROM academic_entry WHERE id=?", String.class, s.subjectId());
    var routine = planner.routine(a);
    var zone = PlannerService.zone((String) routine.get("timezone"));
    UUID notebook = UUID.randomUUID();
    String title = "Estudo · " + subject;
    title = (title.length() > 108 ? title.substring(0, 108) : title) + " · " + DAY.format(s.startsAt().atZoneSameInstant(zone));
    db.jdbc.update("INSERT INTO study_notebook(id,user_id,title) VALUES (?,?,?)", notebook, a.id(), title);
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO study_session(id,user_id,subject_id,notebook_id,starts_at,minutes,goal,personality)"
            + " VALUES (?,?,?,?,?,?,?,?)",
        id,
        a.id(),
        s.subjectId(),
        notebook,
        s.startsAt(),
        s.minutes(),
        goal(s.goal()),
        routine.get("tutorPersonality"));
    changed(a.id());
    return id;
  }

  /** A follow-up session for the same subject that continues in the same notebook. */
  @Transactional
  public UUID continueLater(Actor a, UUID id, OffsetDateTime startsAt, Integer minutes) {
    var session = own(a, id);
    validate(startsAt, minutes);
    UUID next = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO study_session(id,user_id,subject_id,notebook_id,starts_at,minutes,goal,personality,difficulty)"
            + " VALUES (?,?,?,?,?,?,?,?,?)",
        next,
        a.id(),
        session.get("subjectId"),
        session.get("notebookId"),
        startsAt,
        minutes,
        session.get("goal"),
        session.get("personality"),
        session.get("difficulty"));
    changed(a.id());
    return next;
  }

  /** Sessions starting within 15 minutes or started up to three hours ago, for the invitation. */
  public Object due(Actor a) {
    return db.list(
        "SELECT ss.id,ss.subject_id,s.name subject_name,ss.starts_at,ss.minutes,ss.goal,ss.status FROM"
            + " study_session ss JOIN academic_entry s ON s.id=ss.subject_id WHERE ss.user_id=? AND"
            + " ss.status IN ('PLANNED','ACTIVE') AND ss.starts_at BETWEEN now()-interval '3 hours'"
            + " AND now()+interval '15 minutes' ORDER BY ss.starts_at",
        a.id());
  }

  public Object upcoming(Actor a) {
    return db.list(
        "SELECT ss.id,ss.subject_id,s.name subject_name,ss.starts_at,ss.minutes,ss.goal,ss.status FROM"
            + " study_session ss JOIN academic_entry s ON s.id=ss.subject_id WHERE ss.user_id=? AND"
            + " (ss.status='ACTIVE' OR (ss.status='PLANNED' AND ss.starts_at>now()-interval '3"
            + " hours')) ORDER BY ss.starts_at LIMIT 6",
        a.id());
  }

  // ---------------------------------------------------------------- the room

  public Object detail(Actor a, UUID id) {
    var session = own(a, id);
    var result = new LinkedHashMap<String, Object>();
    result.put("session", session);
    var messages = new ArrayList<Map<String, Object>>();
    var sources = List.<Map<String, Object>>of();
    UUID notebook = (UUID) session.get("notebookId");
    if (notebook != null) {
      var attempts = new HashMap<Object, Map<String, Object>>();
      for (var attempt :
          db.list(
              "SELECT generation_id,answers,score,total,wrong_topics FROM study_quiz_attempt WHERE"
                  + " session_id IN (SELECT id FROM study_session WHERE notebook_id=?)",
              notebook)) attempts.put(attempt.get("generationId"), attempt);
      for (var g :
          db.list(
              "SELECT id,question,answer,mode,status,error,created_at FROM notebook_generation WHERE"
                  + " notebook_id=? ORDER BY created_at",
              notebook)) {
        var message = new LinkedHashMap<String, Object>();
        boolean quiz = "QUIZ_JSON".equals(g.get("mode"));
        message.put("id", g.get("id"));
        message.put("kind", quiz ? "QUIZ" : "CHAT");
        message.put("question", g.get("question"));
        message.put("status", g.get("status"));
        message.put("error", g.get("error"));
        message.put("createdAt", g.get("createdAt"));
        if (quiz) {
          if ("READY".equals(g.get("status"))) {
            var questions = parseQuiz((String) g.get("answer"));
            if (questions == null) {
              message.put("status", "FAILED");
              message.put("error", "Não consegui montar este quiz. Gere outro.");
            } else {
              var attempt = attempts.get(g.get("id"));
              message.put(
                  "quiz",
                  questions.stream()
                      .map(
                          q -> {
                            var visible = new LinkedHashMap<String, Object>();
                            visible.put("question", q.get("question"));
                            visible.put("options", q.get("options"));
                            visible.put("topic", q.get("topic"));
                            if (attempt != null) {
                              visible.put("answer", q.get("answer"));
                              visible.put("explanation", q.get("explanation"));
                            }
                            return visible;
                          })
                      .toList());
              if (attempt != null) message.put("attempt", attempt);
            }
          }
        } else message.put("answer", g.get("answer"));
        messages.add(message);
      }
      sources =
          db.list(
              "SELECT id,title,kind,status,error FROM notebook_source WHERE notebook_id=? ORDER BY"
                  + " created_at",
              notebook);
    }
    result.put("messages", messages);
    result.put("sources", sources);
    result.put(
        "mastery",
        db.list(
                "SELECT level,evidence FROM subject_mastery WHERE user_id=? AND subject_id=?",
                a.id(),
                session.get("subjectId"))
            .stream()
            .findFirst()
            .orElse(Map.of("level", "BEGINNER")));
    return result;
  }

  @Transactional
  public Object start(Actor a, UUID id) {
    var session = own(a, id);
    if ("PLANNED".equals(session.get("status")) || "SKIPPED".equals(session.get("status"))) {
      db.jdbc.update(
          "UPDATE study_session SET status='ACTIVE',started_at=coalesce(started_at,now()),updated_at=now()"
              + " WHERE id=?",
          id);
      changed(a.id());
    }
    return detail(a, id);
  }

  @Transactional
  public UUID message(Actor a, UUID id, UUID messageId, String text) {
    var session = active(a, id);
    String body = text == null ? "" : text.strip();
    if (body.isEmpty() || body.length() > 2000)
      throw ApiException.invalid("Escreva sua mensagem em até 2000 caracteres.");
    if (blank((String) session.get("difficulty"), "").isEmpty()) {
      db.jdbc.update(
          "UPDATE study_session SET difficulty=?,updated_at=now() WHERE id=?",
          body.substring(0, Math.min(1000, body.length())),
          id);
      session.put("difficulty", body);
    }
    return notebooks.tutorTurn(a, (UUID) session.get("notebookId"), messageId, body, "TUTOR", orientation(a, session));
  }

  @Transactional
  public UUID quiz(Actor a, UUID id, UUID messageId) {
    var session = active(a, id);
    return notebooks.tutorTurn(
        a,
        (UUID) session.get("notebookId"),
        messageId,
        "Gerar quiz para avaliar o que estudei",
        "QUIZ_JSON",
        orientation(a, session));
  }

  @Transactional
  public Object answer(Actor a, UUID id, UUID quizId, List<Integer> answers) {
    var session = active(a, id);
    var generation =
        db.list(
                "SELECT answer,status FROM notebook_generation WHERE id=? AND notebook_id=? AND"
                    + " mode='QUIZ_JSON'",
                quizId,
                session.get("notebookId"))
            .stream()
            .findFirst()
            .orElseThrow(ApiException::missing);
    var questions = "READY".equals(generation.get("status")) ? parseQuiz((String) generation.get("answer")) : null;
    if (questions == null) throw ApiException.invalid("Este quiz ainda não está pronto.");
    if (answers == null || answers.size() != questions.size())
      throw ApiException.invalid("Responda todas as questões.");
    if (db.exists("SELECT EXISTS(SELECT 1 FROM study_quiz_attempt WHERE generation_id=?)", quizId))
      throw ApiException.invalid("Este quiz já foi respondido. Gere um novo para tentar de novo.");
    int score = 0;
    var results = new ArrayList<Map<String, Object>>();
    var weak = new LinkedHashSet<String>();
    var topics = new LinkedHashMap<String, int[]>();
    for (int i = 0; i < questions.size(); i++) {
      var q = questions.get(i);
      int correctIndex = ((Number) q.get("answer")).intValue();
      Integer chosen = answers.get(i);
      boolean correct = chosen != null && chosen == correctIndex;
      String topic = (String) q.get("topic");
      topics.computeIfAbsent(topic, t -> new int[2]);
      topics.get(topic)[1]++;
      if (correct) {
        score++;
        topics.get(topic)[0]++;
      } else weak.add(topic);
      var result = new LinkedHashMap<String, Object>();
      result.put("correct", correct);
      result.put("chosen", chosen);
      result.put("answer", correctIndex);
      result.put("explanation", q.get("explanation"));
      result.put("topic", topic);
      results.add(result);
    }
    db.jdbc.update(
        "INSERT INTO study_quiz_attempt(id,session_id,user_id,generation_id,answers,score,total,wrong_topics)"
            + " VALUES (?,?,?,?,?::jsonb,?,?,?::jsonb)",
        UUID.randomUUID(),
        id,
        a.id(),
        quizId,
        encode(answers),
        score,
        questions.size(),
        encode(weak));
    updateMastery(a.id(), (UUID) session.get("subjectId"), topics);
    boolean done = score == questions.size();
    if (done) {
      db.jdbc.update(
          "UPDATE study_session SET status='DONE',finished_at=now(),updated_at=now() WHERE id=?", id);
      changed(a.id());
    }
    var response = new LinkedHashMap<String, Object>();
    response.put("score", score);
    response.put("total", questions.size());
    response.put("done", done);
    response.put("weakTopics", new ArrayList<>(weak));
    response.put("results", results);
    return response;
  }

  @Transactional
  public void setPersonality(Actor a, UUID id, String personality) {
    own(a, id);
    if (!PERSONALITIES.contains(personality)) throw ApiException.invalid("Personalidade inválida.");
    db.jdbc.update("UPDATE study_session SET personality=?,updated_at=now() WHERE id=?", personality, id);
  }

  @Transactional
  public void skip(Actor a, UUID id) {
    var session = own(a, id);
    if ("DONE".equals(session.get("status"))) throw ApiException.invalid("Esta sessão já foi concluída.");
    db.jdbc.update("UPDATE study_session SET status='SKIPPED',updated_at=now() WHERE id=?", id);
    changed(a.id());
  }

  @Transactional
  public void finish(Actor a, UUID id) {
    own(a, id);
    db.jdbc.update(
        "UPDATE study_session SET status='DONE',finished_at=coalesce(finished_at,now()),updated_at=now()"
            + " WHERE id=?",
        id);
    changed(a.id());
  }

  /** Deletes the session, every session sharing its notebook, and the notebook itself. */
  @Transactional
  public void delete(Actor a, UUID id) {
    var session = own(a, id);
    Object notebook = session.get("notebookId");
    if (notebook != null) {
      db.jdbc.update("DELETE FROM study_session WHERE user_id=? AND notebook_id=?", a.id(), notebook);
      db.jdbc.update("DELETE FROM study_notebook WHERE id=? AND user_id=?", notebook, a.id());
    }
    db.jdbc.update("DELETE FROM study_session WHERE id=? AND user_id=?", id, a.id());
    changed(a.id());
  }

  // ---------------------------------------------------------------- helpers

  private Map<String, Object> own(Actor a, UUID id) {
    return db.one(
        "SELECT ss.id,ss.subject_id,s.name subject_name,ss.notebook_id,ss.starts_at,ss.minutes,ss.goal,"
            + "ss.status,ss.personality,ss.difficulty,ss.started_at,ss.finished_at FROM study_session ss"
            + " JOIN academic_entry s ON s.id=ss.subject_id WHERE ss.id=? AND ss.user_id=?",
        id,
        a.id());
  }

  private Map<String, Object> active(Actor a, UUID id) {
    var session = own(a, id);
    if (session.get("notebookId") == null)
      throw ApiException.invalid("O caderno desta sessão foi excluído.");
    if (!"ACTIVE".equals(session.get("status")))
      throw ApiException.invalid("Entre na sala de estudo para conversar com o tutor.");
    return session;
  }

  private String orientation(Actor a, Map<String, Object> session) {
    String personality =
        switch ((String) session.get("personality")) {
          case "WELCOMING" ->
              "Acolhedor: caloroso e paciente, celebra cada avanço, usa encorajamento e emojis leves.";
          case "DEMANDING" ->
              "Exigente: direto e firme, cobra raciocínio antes de dar a resposta, pede justificativas"
                  + " e não aceita respostas vagas; nunca humilha nem usa ironia.";
          default ->
              "Equilibrado: claro e amigável, equilibra explicação e desafio na medida certa.";
        };
    var mastery =
        db.list(
            "SELECT level,evidence FROM subject_mastery WHERE user_id=? AND subject_id=?",
            a.id(),
            session.get("subjectId"));
    String history =
        mastery.isEmpty()
            ? "Primeira sessão desta matéria: descubra o nível do aluno com perguntas curtas."
            : "Nível atual: " + mastery.getFirst().get("level") + ". Desempenho por tema (acertos/total): "
                + mastery.getFirst().get("evidence");
    return "Matéria: " + session.get("subjectName")
        + "\nObjetivo da sessão: " + blank((String) session.get("goal"), "não informado")
        + "\nDificuldade relatada pelo aluno: " + blank((String) session.get("difficulty"), "ainda não informada; pergunte")
        + "\nDuração planejada: " + session.get("minutes") + " minutos"
        + "\nPersonalidade do tutor: " + personality
        + "\nHistórico do aluno: " + history;
  }

  private void updateMastery(UUID user, UUID subject, Map<String, int[]> topics) {
    Map<String, Object> evidence = new LinkedHashMap<>();
    var current =
        db.list("SELECT evidence FROM subject_mastery WHERE user_id=? AND subject_id=?", user, subject);
    if (!current.isEmpty()) {
      try {
        Object stored = current.getFirst().get("evidence");
        evidence =
            stored instanceof String text
                ? json.readValue(text, new TypeReference<>() {})
                : json.convertValue(stored, new TypeReference<Map<String, Object>>() {});
      } catch (Exception ignored) {
        evidence = new LinkedHashMap<>();
      }
    }
    int correct = 0, total = 0;
    for (var topic : topics.entrySet()) {
      @SuppressWarnings("unchecked")
      var previous = (List<Number>) evidence.getOrDefault(topic.getKey(), List.of(0, 0));
      evidence.put(
          topic.getKey(),
          List.of(previous.get(0).intValue() + topic.getValue()[0], previous.get(1).intValue() + topic.getValue()[1]));
    }
    for (var value : evidence.values()) {
      if (value instanceof List<?> pair && pair.size() == 2) {
        correct += ((Number) pair.get(0)).intValue();
        total += ((Number) pair.get(1)).intValue();
      }
    }
    double rate = total == 0 ? 0 : (double) correct / total;
    String level =
        total < 5
            ? "DEVELOPING"
            : rate >= 0.95 && total >= 15 ? "MASTERED" : rate >= 0.85 ? "ADVANCED" : rate >= 0.65 ? "INTERMEDIATE" : "DEVELOPING";
    db.jdbc.update(
        "INSERT INTO subject_mastery(user_id,subject_id,level,evidence) VALUES (?,?,?,?::jsonb) ON"
            + " CONFLICT(user_id,subject_id) DO UPDATE SET level=EXCLUDED.level,evidence=EXCLUDED.evidence,updated_at=now()",
        user,
        subject,
        level,
        encode(evidence));
  }

  /** The quiz the model wrote, or null when it is not usable. */
  List<Map<String, Object>> parseQuiz(String text) {
    if (text == null) return null;
    int start = text.indexOf('{'), end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      Map<String, Object> root = json.readValue(text.substring(start, end + 1), new TypeReference<>() {});
      if (!(root.get("questions") instanceof List<?> list) || list.size() < 2 || list.size() > 10) return null;
      var questions = new ArrayList<Map<String, Object>>();
      for (var item : list) {
        if (!(item instanceof Map<?, ?> q)) return null;
        if (!(q.get("question") instanceof String question) || question.isBlank()) return null;
        if (!(q.get("options") instanceof List<?> options) || options.size() < 2 || options.size() > 6) return null;
        if (!(q.get("answer") instanceof Number answer) || answer.intValue() < 0 || answer.intValue() >= options.size()) return null;
        var clean = new LinkedHashMap<String, Object>();
        clean.put("question", question);
        clean.put("options", options.stream().map(String::valueOf).toList());
        clean.put("answer", answer.intValue());
        clean.put("explanation", q.get("explanation") instanceof String e ? e : "");
        clean.put("topic", q.get("topic") instanceof String t && !t.isBlank() ? t.strip() : "Geral");
        questions.add(clean);
      }
      return questions;
    } catch (Exception e) {
      return null;
    }
  }

  private void validate(OffsetDateTime startsAt, Integer minutes) {
    if (startsAt == null) throw ApiException.invalid("Informe o dia e o horário do estudo.");
    if (minutes == null || minutes < 15 || minutes > 240)
      throw ApiException.invalid("A sessão de estudo vai de 15 a 240 minutos.");
  }

  private static String goal(String goal) {
    String value = goal == null ? "" : goal.strip();
    if (value.length() > 300) throw ApiException.invalid("Use até 300 caracteres no objetivo.");
    return value;
  }

  private static String blank(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }

  private String encode(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  private void changed(UUID user) {
    events.publishEvent(new PlannerChanged(user));
  }
}
