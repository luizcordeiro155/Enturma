package br.com.enturma;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import br.com.enturma.ai.AiProvider;
import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.planner.StudySessionService;
import br.com.enturma.planner.StudySessionService.NewSession;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class StudySessionIntegrationTest {
  @MockitoBean AiProvider ai;
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired StudySessionService study;
  @Autowired br.com.enturma.planner.PlannerService planner;
  Actor a, b;
  UUID subject;

  static final String QUIZ =
      "```json\n{\"questions\":["
          + "{\"question\":\"Quanto é o limite de x quando x tende a 2?\",\"options\":[\"1\",\"2\",\"3\",\"4\"],\"answer\":1,\"explanation\":\"Substitua x por 2.\",\"topic\":\"Limites\"},"
          + "{\"question\":\"Derivada de x²?\",\"options\":[\"x\",\"2x\",\"x²\",\"2\"],\"answer\":1,\"explanation\":\"Regra da potência.\",\"topic\":\"Derivadas\"},"
          + "{\"question\":\"Derivada de uma constante?\",\"options\":[\"0\",\"1\",\"a própria constante\",\"x\"],\"answer\":0,\"explanation\":\"Constantes não variam.\",\"topic\":\"Derivadas\"}"
          + "]}\n```";

  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    return auth.authenticate(
            auth.register("Estudante Teste", "sess_" + tag, tag + "@example.test", "password-12345", "JUnit")
                .accessToken())
        .orElseThrow();
  }

  @BeforeEach
  void setup() {
    a = user();
    b = user();
    subject =
        db.jdbc.queryForObject(
            "SELECT id FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY id LIMIT 1",
            UUID.class);
    db.jdbc.update("INSERT INTO user_subject(user_id,subject_id) VALUES (?,?)", a.id(), subject);
    when(ai.enabled()).thenReturn(true);
    when(ai.answer(anyString(), anyString(), anyString(), eq(false)))
        .thenAnswer(
            call -> {
              String instruction = call.getArgument(1);
              return new AiProvider.Answer(
                  instruction.contains("JSON")
                      ? QUIZ
                      : "Vamos por partes. Um limite descreve aonde a função vai. Qual é o limite de x+1 quando x tende a 1?",
                  List.of());
            });
  }

  /** Sessions here start within minutes; leaving their jobs due would leak into other classes. */
  @AfterEach
  void cancelPendingReminders() {
    db.jdbc.update(
        "UPDATE academic_reminder_job SET status='CANCELLED' WHERE status='PENDING' AND user_id IN (?,?)",
        a.id(),
        b.id());
  }

  OffsetDateTime inMinutes(int minutes) {
    return OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(minutes).withNano(0);
  }

  @SuppressWarnings("unchecked")
  Map<String, Object> waitReady(UUID session, int generations) throws InterruptedException {
    for (int i = 0; i < 60; i++) {
      var detail = (Map<String, Object>) study.detail(a, session);
      var messages = (List<Map<String, Object>>) detail.get("messages");
      if (messages.size() >= generations
          && messages.stream().noneMatch(m -> Set.of("PENDING", "PROCESSING").contains(m.get("status"))))
        return detail;
      Thread.sleep(250);
    }
    throw new AssertionError("A IA não respondeu a tempo.");
  }

  @Test
  @SuppressWarnings("unchecked")
  void schedulingCreatesANotebookAndTheCalendarShowsTheStudy() {
    var day = LocalDate.now(java.time.ZoneOffset.ofHours(-3)).plusDays(20);
    var startsAt = day.atTime(19, 0).atOffset(java.time.ZoneOffset.ofHours(-3));
    UUID id = study.create(a, new NewSession(subject, startsAt, 60, "Revisar limites"));
    var session = (Map<String, Object>) ((Map<String, Object>) study.detail(a, id)).get("session");
    assertThat(session).containsEntry("status", "PLANNED").containsEntry("goal", "Revisar limites");
    assertThat(session.get("notebookId")).isNotNull();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT title FROM study_notebook WHERE id=?", String.class, session.get("notebookId")))
        .startsWith("Estudo · ");
    var events =
        (List<Map<String, Object>>)
            planner.calendar(a, day.minusDays(2), day.plusDays(2)).get("events");
    assertThat(events)
        .anySatisfy(
            e ->
                assertThat(e)
                    .containsEntry("kind", "STUDY")
                    .containsEntry("id", id)
                    .containsEntry("status", "SCHEDULED")
                    .containsEntry("startsAt", startsAt.toInstant().toString()));
    assertThatThrownBy(() -> study.create(b, new NewSession(subject, startsAt, 60, "")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> study.create(a, new NewSession(subject, startsAt, 5, "")))
        .isInstanceOf(ApiException.class);
    // A day or time that already passed cannot be scheduled.
    assertThatThrownBy(() -> study.create(a, new NewSession(subject, inMinutes(-30), 30, "")))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("já passou");
    assertThatThrownBy(() -> study.continueLater(a, id, inMinutes(-24 * 60), 30))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("já passou");
  }

  @Test
  @SuppressWarnings("unchecked")
  void tutorAnswersWithTheStudentsDifficultyAndPersonality() throws Exception {
    UUID id = study.create(a, new NewSession(subject, inMinutes(5), 45, "Entender limites"));
    study.start(a, id);
    study.setPersonality(a, id, "DEMANDING");
    study.message(a, id, UUID.randomUUID(), "Tenho dificuldade com limites laterais 😵");
    var detail = waitReady(id, 1);
    var messages = (List<Map<String, Object>>) detail.get("messages");
    assertThat(messages.getFirst())
        .containsEntry("kind", "CHAT")
        .containsEntry("status", "READY")
        .containsEntry("question", "Tenho dificuldade com limites laterais 😵");
    assertThat((String) messages.getFirst().get("answer")).contains("Qual é o limite");
    var session = (Map<String, Object>) detail.get("session");
    assertThat(session)
        .containsEntry("status", "ACTIVE")
        .containsEntry("difficulty", "Tenho dificuldade com limites laterais 😵")
        .containsEntry("personality", "DEMANDING");
    var context = org.mockito.ArgumentCaptor.forClass(String.class);
    verify(ai, atLeastOnce()).answer(context.capture(), anyString(), anyString(), eq(false));
    assertThat(context.getValue())
        .contains("ORIENTAÇÕES DO ENTURMA")
        .contains("limites laterais")
        .contains("Exigente")
        .contains("Entender limites");
  }

  @Test
  @SuppressWarnings("unchecked")
  void quizIsGradedAndOnlyAPerfectScoreFinishesTheNotebook() throws Exception {
    UUID id = study.create(a, new NewSession(subject, inMinutes(1), 30, ""));
    study.start(a, id);
    UUID quiz = UUID.randomUUID();
    study.quiz(a, id, quiz);
    var detail = waitReady(id, 1);
    var message = ((List<Map<String, Object>>) detail.get("messages")).getFirst();
    assertThat(message).containsEntry("kind", "QUIZ");
    var questions = (List<Map<String, Object>>) message.get("quiz");
    assertThat(questions).hasSize(3);
    assertThat(questions.getFirst()).containsKeys("question", "options", "topic").doesNotContainKey("answer");

    var wrong = (Map<String, Object>) study.answer(a, id, quiz, List.of(0, 1, 0));
    assertThat(wrong).containsEntry("score", 2).containsEntry("total", 3).containsEntry("done", false);
    assertThat((List<String>) wrong.get("weakTopics")).containsExactly("Limites");
    assertThat(((List<Map<String, Object>>) wrong.get("results")).getFirst())
        .containsEntry("correct", false)
        .containsEntry("answer", 1)
        .containsEntry("explanation", "Substitua x por 2.");
    assertThatThrownBy(() -> study.answer(a, id, quiz, List.of(1, 1, 0)))
        .isInstanceOf(ApiException.class);

    UUID second = UUID.randomUUID();
    study.quiz(a, id, second);
    waitReady(id, 2);
    var right = (Map<String, Object>) study.answer(a, id, second, List.of(1, 1, 0));
    assertThat(right).containsEntry("score", 3).containsEntry("done", true);
    var session = (Map<String, Object>) ((Map<String, Object>) study.detail(a, id)).get("session");
    assertThat(session).containsEntry("status", "DONE");
    var mastery =
        db.one("SELECT level,evidence FROM subject_mastery WHERE user_id=? AND subject_id=?", a.id(), subject);
    assertThat(String.valueOf(mastery.get("evidence"))).contains("Limites").contains("[1,2]");
  }

  @Test
  @SuppressWarnings("unchecked")
  void dueSessionsSkipAndDeleteAreOwnedByTheStudent() {
    UUID soon = study.create(a, new NewSession(subject, inMinutes(10), 30, ""));
    UUID later = study.create(a, new NewSession(subject, inMinutes(600), 30, ""));
    assertThat((List<Map<String, Object>>) study.due(a)).extracting(s -> s.get("id")).containsExactly(soon);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_reminder_job WHERE user_id=? AND kind='STUDY' AND status='PENDING'",
                Integer.class,
                a.id()))
        .isEqualTo(2);
    assertThatThrownBy(() -> study.detail(b, soon)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> study.skip(b, soon)).isInstanceOf(ApiException.class);
    study.skip(a, soon);
    assertThat((List<?>) study.due(a)).isEmpty();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM academic_reminder_job WHERE user_id=? AND kind='STUDY' AND status='PENDING'",
                Integer.class,
                a.id()))
        .isEqualTo(1);
    var notebook =
        ((Map<String, Object>) ((Map<String, Object>) study.detail(a, later)).get("session")).get("notebookId");
    study.delete(a, later);
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM study_notebook WHERE id=?)", notebook)).isFalse();
    assertThatThrownBy(() -> study.detail(a, later)).isInstanceOf(ApiException.class);
  }

  @Test
  @SuppressWarnings("unchecked")
  void continuingLaterKeepsTheSameNotebook() {
    UUID id = study.create(a, new NewSession(subject, inMinutes(5), 30, "Derivadas"));
    UUID next = study.continueLater(a, id, inMinutes(7 * 24 * 60), 45);
    var first = (Map<String, Object>) ((Map<String, Object>) study.detail(a, id)).get("session");
    var second = (Map<String, Object>) ((Map<String, Object>) study.detail(a, next)).get("session");
    assertThat(second)
        .containsEntry("notebookId", first.get("notebookId"))
        .containsEntry("goal", "Derivadas")
        .containsEntry("status", "PLANNED");
  }
}
