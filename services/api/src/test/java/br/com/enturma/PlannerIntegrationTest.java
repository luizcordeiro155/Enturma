package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.planner.PlannerService.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class PlannerIntegrationTest {
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired PersonalDataExport personalExport;
  @Autowired AccountPrivacyController privacy;
  @Autowired br.com.enturma.planner.PlannerService planner;
  Actor a, b;

  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    return auth.authenticate(
            auth.register("Estudante", "plan_" + tag, tag + "@example.test", "password-12345", "JUnit")
                .accessToken())
        .orElseThrow();
  }

  /** A verified catalog subject saved to the student's profile. */
  UUID subject(Actor student) {
    UUID id =
        db.jdbc.queryForObject(
            "SELECT id FROM academic_entry WHERE kind='SUBJECT' AND status='VERIFIED' ORDER BY id"
                + " LIMIT 1",
            UUID.class);
    db.jdbc.update(
        "INSERT INTO user_subject(user_id,subject_id) VALUES (?,?) ON CONFLICT DO NOTHING",
        student.id(),
        id);
    return id;
  }

  @BeforeEach
  void setup() {
    a = user();
    b = user();
  }

  @SuppressWarnings("unchecked")
  List<Map<String, Object>> exported(Actor actor, String section) {
    var body = (Map<String, Object>) personalExport.export(actor, section, 0).getBody();
    return (List<Map<String, Object>>) body.get("items");
  }

  @Test
  void exportAndDeletionCoverStudyTables() {
    UUID subject = subject(a), schedule = UUID.randomUUID();
    db.jdbc.update("INSERT INTO academic_routine(user_id) VALUES (?)", a.id());
    db.jdbc.update(
        "INSERT INTO academic_class_schedule(id,user_id,subject_id,weekday,starts_at,ends_at,valid_from)"
            + " VALUES (?,?,?,1,'19:00','22:30',current_date)",
        schedule,
        a.id(),
        subject);
    db.jdbc.update(
        "INSERT INTO academic_class_exception(id,schedule_id,user_id,occurs_on,kind) VALUES"
            + " (?,?,?,current_date,'CANCELLED')",
        UUID.randomUUID(),
        schedule,
        a.id());
    db.jdbc.update(
        "INSERT INTO calendar_holiday(id,user_id,date,name,scope) VALUES (?,?,current_date,'Aniversário"
            + " da cidade','CITY')",
        UUID.randomUUID(),
        a.id());
    db.jdbc.update(
        "INSERT INTO academic_reminder_job(id,user_id,kind,source_id,occurrence_at,fire_at) VALUES"
            + " (?,?,'CLASS',?,now()+interval '1 day',now()+interval '22 hours')",
        UUID.randomUUID(),
        a.id(),
        schedule);
    db.jdbc.update(
        "INSERT INTO campus_task(id,user_id,kind,title,due_at) VALUES (?,?,'EXAM','Prova 1',now())",
        UUID.randomUUID(),
        a.id());
    db.jdbc.update(
        "INSERT INTO focus_session(id,user_id,planned_minutes) VALUES (?,?,30)",
        UUID.randomUUID(),
        a.id());
    for (String section :
        List.of(
            "study-routine",
            "study-classes",
            "study-class-exceptions",
            "study-holidays",
            "study-reminders",
            "study-tasks",
            "study-focus")) {
      assertThat(personalExport.sections()).contains(section);
      assertThat(exported(a, section)).as(section).hasSize(1);
      assertThat(exported(b, section)).as(section).isEmpty();
    }
    privacy.now(a);
    for (String table :
        List.of(
            "academic_routine",
            "academic_class_schedule",
            "academic_class_exception",
            "calendar_holiday",
            "academic_reminder_job",
            "campus_task",
            "focus_session")) {
      assertThat(
              db.jdbc.queryForObject(
                  "SELECT count(*) FROM " + table + " WHERE user_id=?", Integer.class, a.id()))
          .as(table)
          .isZero();
    }
  }

  static LocalDate d(String iso) {
    return LocalDate.parse(iso);
  }

  @SuppressWarnings("unchecked")
  static List<Map<String, Object>> events(Map<String, Object> calendar) {
    return (List<Map<String, Object>>) calendar.get("events");
  }

  @SuppressWarnings("unchecked")
  static List<Map<String, Object>> holidays(Map<String, Object> calendar) {
    return (List<Map<String, Object>>) calendar.get("holidays");
  }

  ClassSeries mondays(UUID subject, String from, String until) {
    return new ClassSeries(subject, List.of(1), "19:00", "22:30", d(from), until == null ? null : d(until), "Sala 12");
  }

  @Test
  void routineDefaultsFollowShiftAndCampus() {
    UUID period =
        db.jdbc.queryForObject(
            "SELECT id FROM academic_entry WHERE kind='PERIOD' ORDER BY id LIMIT 1", UUID.class);
    db.jdbc.update(
        "INSERT INTO academic_enrollment(user_id,period_id,shift) VALUES (?,?,'EVENING')",
        a.id(),
        period);
    UUID campus =
        db.jdbc.queryForObject(
            "SELECT id FROM academic_campus WHERE state='MG' ORDER BY id LIMIT 1", UUID.class);
    db.jdbc.update(
        "INSERT INTO academic_identity(user_id,status,campus_id) VALUES (?,'PENDING',?) ON CONFLICT"
            + " (user_id) DO UPDATE SET campus_id=EXCLUDED.campus_id",
        a.id(),
        campus);
    var routine = planner.routine(a);
    assertThat(routine)
        .containsEntry("defaultStart", "19:00")
        .containsEntry("defaultEnd", "22:30")
        .containsEntry("state", "MG")
        .containsEntry("classReminderMinutes", 120)
        .containsEntry("timezone", "America/Sao_Paulo")
        .containsEntry("weekdays", List.of(1, 2, 3, 4, 5));
  }

  @Test
  void weeklyClassExpandsAcrossRange() {
    UUID subject = subject(a);
    planner.addClasses(a, mondays(subject, "2026-03-01", "2026-06-30"));
    var march = events(planner.calendar(a, d("2026-03-01"), d("2026-03-31")));
    assertThat(march)
        .filteredOn(e -> "CLASS".equals(e.get("kind")))
        .extracting(e -> e.get("occursOn"))
        .containsExactly("2026-03-02", "2026-03-09", "2026-03-16", "2026-03-23", "2026-03-30");
    var first = march.getFirst();
    assertThat(first)
        .containsEntry("startsAt", "2026-03-02T22:00:00Z")
        .containsEntry("endsAt", "2026-03-03T01:30:00Z")
        .containsEntry("status", "SCHEDULED")
        .containsEntry("subjectId", subject)
        .containsKey("title");
  }

  @Test
  void cancelledOccurrenceIsMarkedAndMovedOneAppearsAtNewTime() {
    UUID subject = subject(a);
    UUID series = planner.addClasses(a, mondays(subject, "2026-03-01", null)).getFirst();
    planner.addException(a, series, new ClassException(d("2026-03-09"), "CANCELLED", null, null, "Professor viajando"));
    planner.addException(
        a,
        series,
        new ClassException(d("2026-03-16"), "MOVED", OffsetDateTime.parse("2026-03-18T19:00:00-03:00"), 90, ""));
    planner.addException(
        a,
        series,
        new ClassException(d("2026-03-21"), "EXTRA", OffsetDateTime.parse("2026-03-21T09:00:00-03:00"), 120, "Reposição"));
    var march = events(planner.calendar(a, d("2026-03-01"), d("2026-03-31")));
    assertThat(march).anySatisfy(e -> assertThat(e).containsEntry("occursOn", "2026-03-09").containsEntry("status", "CANCELLED"));
    assertThat(march)
        .anySatisfy(
            e ->
                assertThat(e)
                    .containsEntry("occursOn", "2026-03-16")
                    .containsEntry("status", "MOVED")
                    .containsEntry("startsAt", "2026-03-18T22:00:00Z")
                    .containsEntry("endsAt", "2026-03-18T23:30:00Z"));
    assertThat(march)
        .anySatisfy(
            e ->
                assertThat(e)
                    .containsEntry("status", "EXTRA")
                    .containsEntry("startsAt", "2026-03-21T12:00:00Z"));
  }

  @Test
  void holidayMarksButDoesNotCancel() {
    UUID subject = subject(a);
    planner.addClasses(
        a, new ClassSeries(subject, List.of(2), "08:00", "10:00", d("2026-04-01"), null, ""));
    var april = planner.calendar(a, d("2026-04-01"), d("2026-04-30"));
    assertThat(events(april))
        .anySatisfy(
            e ->
                assertThat(e)
                    .containsEntry("occursOn", "2026-04-21")
                    .containsEntry("holiday", true)
                    .containsEntry("status", "SCHEDULED"));
    planner.addHoliday(a, new PersonalHoliday(d("2026-04-23"), "Aniversário da cidade", "CITY"));
    assertThat(holidays(planner.calendar(a, d("2026-04-01"), d("2026-04-30"))))
        .anySatisfy(h -> assertThat(h).containsEntry("date", "2026-04-21").containsEntry("scope", "NATIONAL"))
        .anySatisfy(h -> assertThat(h).containsEntry("date", "2026-04-23").containsEntry("custom", true));
  }

  @Test
  void invalidSeriesAndRangesAreRejected() {
    UUID subject = subject(a);
    assertThatThrownBy(() -> planner.addClasses(a, new ClassSeries(subject, List.of(1), "22:00", "19:00", d("2026-03-01"), null, "")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.addClasses(a, mondays(subject, "2026-03-01", "2026-02-01")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.addClasses(a, new ClassSeries(subject, List.of(8), "19:00", "20:00", d("2026-03-01"), null, "")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.addClasses(a, new ClassSeries(subject, List.of(), "19:00", "20:00", d("2026-03-01"), null, "")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.calendar(a, d("2026-03-31"), d("2026-03-01"))).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.calendar(a, d("2026-01-01"), d("2026-03-31"))).isInstanceOf(ApiException.class);
  }

  @Test
  void subjectMustBelongToStudentAndOthersCannotTouchMyClasses() {
    UUID subject = subject(a);
    assertThatThrownBy(() -> planner.addClasses(b, mondays(subject, "2026-03-01", null)))
        .isInstanceOf(ApiException.class);
    UUID series = planner.addClasses(a, mondays(subject, "2026-03-01", null)).getFirst();
    assertThatThrownBy(() -> planner.deleteClass(b, series)).isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () -> planner.addException(b, series, new ClassException(d("2026-03-09"), "CANCELLED", null, null, "")))
        .isInstanceOf(ApiException.class);
    assertThat(events(planner.calendar(b, d("2026-03-01"), d("2026-03-31")))).isEmpty();
  }

  @Test
  void studentWithoutCampusGetsNationalHolidaysOnly() {
    var holidays = holidays(planner.calendar(a, d("2026-07-01"), d("2026-07-31")));
    assertThat(holidays).noneMatch(h -> "STATE".equals(h.get("scope")));
  }

  @Test
  void examsAndAssignmentsShowOnTheCalendar() {
    UUID task =
        planner.addTask(
            a, new PlannerTask("EXAM", "Prova de Cálculo", null, OffsetDateTime.parse("2026-03-20T10:00:00-03:00"), 120));
    assertThat(events(planner.calendar(a, d("2026-03-01"), d("2026-03-31"))))
        .anySatisfy(
            e ->
                assertThat(e)
                    .containsEntry("id", task)
                    .containsEntry("kind", "EXAM")
                    .containsEntry("title", "Prova de Cálculo")
                    .containsEntry("startsAt", "2026-03-20T13:00:00Z"));
    assertThatThrownBy(() -> planner.deleteTask(b, task)).isInstanceOf(ApiException.class);
    planner.deleteTask(a, task);
    assertThat(events(planner.calendar(a, d("2026-03-01"), d("2026-03-31")))).isEmpty();
  }
}
