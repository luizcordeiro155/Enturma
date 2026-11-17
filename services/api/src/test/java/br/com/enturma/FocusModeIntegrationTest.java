package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.planner.PlannerService;
import br.com.enturma.planner.PlannerService.*;
import br.com.enturma.planner.StudySessionService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class FocusModeIntegrationTest {
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired PlannerService planner;
  @Autowired StudySessionService study;
  @Autowired br.com.enturma.notifications.NotificationService notifications;
  Actor a;
  UUID subject;

  @BeforeEach
  void setup() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    a = auth.authenticate(auth.register("Estudante", "foco_" + tag, tag + "@example.test", "password-12345", "JUnit").accessToken())
        .orElseThrow();
    subject = db.jdbc.queryForObject(
        "SELECT id FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY id LIMIT 1", UUID.class);
    db.jdbc.update("INSERT INTO user_subject(user_id,subject_id) VALUES (?,?) ON CONFLICT DO NOTHING", a.id(), subject);
  }

  @AfterEach
  void quiet() {
    db.jdbc.update("UPDATE academic_reminder_job SET status='CANCELLED' WHERE status='PENDING' AND user_id=?", a.id());
  }

  @Test
  void aClassHappeningNowPausesTheSocialUntilItEnds() {
    assertThat(planner.focus(a)).containsEntry("enabled", true).containsEntry("active", false).containsEntry("blocked", false);
    var zone = ZoneId.of("America/Sao_Paulo");
    var now = ZonedDateTime.now(zone);
    UUID series = planner.addClasses(a, new ClassSeries(subject, List.of(now.plusDays(3).getDayOfWeek().getValue()), "19:00", "21:00",
        now.toLocalDate(), null, "Sala 3")).getFirst();
    planner.addException(a, series, new ClassException(now.toLocalDate(), "EXTRA", now.minusMinutes(10).toOffsetDateTime(), 60, ""));
    var focus = planner.focus(a);
    assertThat(focus).containsEntry("active", true).containsEntry("blocked", true).containsEntry("kind", "CLASS");
    assertThat((String) focus.get("title")).isNotBlank();
    assertThat(Instant.parse((String) focus.get("until"))).isAfter(Instant.now().plusSeconds(45 * 60));

    planner.setFocusMode(a, false);
    assertThat(planner.focus(a)).containsEntry("enabled", false).containsEntry("active", true).containsEntry("blocked", false);
    assertThat(planner.routine(a)).containsEntry("focusMode", false);
    planner.setFocusMode(a, true);
    assertThat(planner.focus(a)).containsEntry("blocked", true);
  }

  @Test
  void anAiStudySessionPausesTheSocialAndASkippedOneDoesNot() {
    UUID session = study.create(a, new StudySessionService.NewSession(subject, OffsetDateTime.now().plusMinutes(1), 45, "Limites"));
    // Starting early counts too: the student is in the room.
    study.start(a, session);
    var focus = planner.focus(a);
    assertThat(focus).containsEntry("blocked", true).containsEntry("kind", "STUDY").containsEntry("studyId", session);
    study.finish(a, session);
    assertThat(planner.focus(a)).containsEntry("active", false);

    UUID later = study.create(a, new StudySessionService.NewSession(subject, OffsetDateTime.now().plusMinutes(1), 30, ""));
    db.jdbc.update("UPDATE study_session SET starts_at=now()-interval '5 minutes' WHERE id=?", later);
    assertThat(planner.focus(a)).containsEntry("blocked", true).containsEntry("studyId", later);
    study.skip(a, later);
    assertThat(planner.focus(a)).containsEntry("blocked", false);
  }

  @Test
  void aSessionForTomorrowStartedEarlyAlsoPausesTheSocial() {
    // At 23:59 a session "in one minute" belongs to tomorrow's calendar.
    var zone = ZoneId.of("America/Sao_Paulo");
    var tomorrow = ZonedDateTime.now(zone).toLocalDate().plusDays(1).atTime(0, 30).atZone(zone);
    UUID session =
        study.create(a, new StudySessionService.NewSession(subject, tomorrow.toOffsetDateTime(), 45, "Revisão"));
    study.start(a, session);
    assertThat(planner.focus(a)).containsEntry("blocked", true).containsEntry("studyId", session);
    study.finish(a, session);
  }

  @Test
  void socialPushWaitsDuringFocusButStaysInTheApp() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    Actor friend = auth.authenticate(auth.register("Amigo", "amg_" + tag, "amg" + tag + "@example.test", "password-12345", "JUnit").accessToken())
        .orElseThrow();
    UUID session = study.create(a, new StudySessionService.NewSession(subject, OffsetDateTime.now().plusMinutes(1), 45, ""));
    study.start(a, session);
    UUID post = UUID.randomUUID();
    notifications.send(friend.id(), a.id(), "SOCIAL_LIKE", "social:interaction", post, "/social", "Curtiu sua publicação");
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM notification WHERE user_id=? AND target_id=?)", a.id(), post)).isTrue();
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM notification_push_delivery WHERE user_id=? AND dedupe_key LIKE ?)", a.id(), "%" + post + "%")).isFalse();
    // Study reminders and other areas still reach the phone.
    UUID other = UUID.randomUUID();
    notifications.send(friend.id(), a.id(), "FRIEND_REQUEST", null, other, "/friends", "Pedido de amizade");
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM notification_push_delivery WHERE user_id=? AND dedupe_key LIKE ?)", a.id(), "%" + other + "%")).isTrue();
    // With focus mode off, Social pushes go out again.
    planner.setFocusMode(a, false);
    UUID again = UUID.randomUUID();
    notifications.send(friend.id(), a.id(), "SOCIAL_LIKE", "social:interaction", again, "/social", "Curtiu");
    assertThat(db.exists("SELECT EXISTS(SELECT 1 FROM notification_push_delivery WHERE user_id=? AND dedupe_key LIKE ?)", a.id(), "%" + again + "%")).isTrue();
  }

  @Test
  void savingTheRoutineWithoutTheFieldKeepsTheChoice() {
    planner.setFocusMode(a, false);
    var r = planner.routine(a);
    planner.saveRoutine(a, new Routine((String) r.get("timezone"), (String) r.get("defaultStart"), (String) r.get("defaultEnd"),
        List.of(1, 2, 3), null, null, 120, null, null, "BALANCED", null, null, null));
    assertThat(planner.routine(a)).containsEntry("focusMode", false);
  }
}
