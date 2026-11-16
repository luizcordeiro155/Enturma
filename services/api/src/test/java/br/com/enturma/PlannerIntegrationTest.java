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

@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class PlannerIntegrationTest {
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired PersonalDataExport personalExport;
  @Autowired AccountPrivacyController privacy;
  @Autowired br.com.enturma.planner.PlannerService planner;
  @Autowired br.com.enturma.planner.PlannerReminders reminders;
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
    a = noVacations(user());
    b = noVacations(user());
  }

  /** Clock-relative tests must not depend on whether today falls in the default school breaks. */
  Actor noVacations(Actor student) {
    db.jdbc.update(
        "INSERT INTO calendar_vacation_year(user_id,year) SELECT ?,y FROM generate_series(2020,2040) y"
            + " ON CONFLICT DO NOTHING",
        student.id());
    return student;
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
    db.jdbc.update(
        "INSERT INTO calendar_vacation(id,user_id,starts_on,ends_on,name) VALUES"
            + " (?,?,current_date,current_date+10,'Férias')",
        UUID.randomUUID(),
        a.id());
    db.jdbc.update(
        "INSERT INTO class_attendance(user_id,occurrence_key,schedule_id,occurs_on,status) VALUES"
            + " (?,?,?,current_date,'ABSENT')",
        a.id(),
        schedule + ":" + LocalDate.now(),
        schedule);
    for (String section :
        List.of(
            "study-routine",
            "study-classes",
            "study-class-exceptions",
            "study-holidays",
            "study-reminders",
            "study-tasks",
            "study-focus",
            "study-vacations",
            "study-attendance")) {
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
            "focus_session",
            "calendar_vacation",
            "calendar_vacation_year",
            "class_attendance")) {
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

  static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

  /** A weekly class whose next occurrence is the day after tomorrow, at 19:00 São Paulo time. */
  UUID upcomingClass(Actor student) {
    var day = LocalDate.now(SP).plusDays(2);
    return planner
        .addClasses(
            student,
            new ClassSeries(subject(student), List.of(day.getDayOfWeek().getValue()), "19:00", "22:30", LocalDate.now(SP), null, ""))
        .getFirst();
  }

  List<Map<String, Object>> jobs(Actor student, String status) {
    return jobs(student, status, "CLASS");
  }

  List<Map<String, Object>> jobs(Actor student, String status, String kind) {
    return db.list(
        "SELECT source_id,occurrence_at,fire_at,status FROM academic_reminder_job WHERE user_id=? AND"
            + " status=? AND kind=? ORDER BY occurrence_at",
        student.id(),
        status,
        kind);
  }

  @Test
  void classReminderFiresTwoHoursBefore() {
    UUID series = upcomingClass(a);
    var next = jobs(a, "PENDING").getFirst();
    var start = LocalDate.now(SP).plusDays(2).atTime(19, 0).atZone(SP).toInstant();
    assertThat(next)
        .containsEntry("sourceId", series)
        .containsEntry("occurrenceAt", start.toString())
        .containsEntry("fireAt", start.minus(Duration.ofHours(2)).toString());
  }

  @Test
  void rescheduleIsIdempotent() {
    upcomingClass(a);
    int before = jobs(a, "PENDING").size();
    reminders.reschedule(a.id());
    reminders.reschedule(a.id());
    reminders.reschedule(a.id());
    assertThat(jobs(a, "PENDING")).hasSize(before).isNotEmpty();
  }

  @Test
  void cancelledOrMovedClassCancelsOldJob() {
    UUID series = upcomingClass(a);
    var day = LocalDate.now(SP).plusDays(2);
    var original = day.atTime(19, 0).atZone(SP).toInstant().toString();
    planner.addException(a, series, new ClassException(day, "CANCELLED", null, null, ""));
    assertThat(jobs(a, "PENDING")).noneMatch(j -> original.equals(j.get("occurrenceAt")));
    assertThat(jobs(a, "CANCELLED")).anyMatch(j -> original.equals(j.get("occurrenceAt")));
    var nextWeek = day.plusWeeks(1);
    var moved = nextWeek.atTime(15, 0).atZone(SP).toOffsetDateTime();
    planner.addException(a, series, new ClassException(nextWeek, "MOVED", moved, null, ""));
    assertThat(jobs(a, "PENDING"))
        .anyMatch(j -> moved.toInstant().toString().equals(j.get("occurrenceAt")))
        .noneMatch(j -> nextWeek.atTime(19, 0).atZone(SP).toInstant().toString().equals(j.get("occurrenceAt")));
  }

  @Test
  void concurrentDeliverySendsOnce() throws Exception {
    UUID series = upcomingClass(a);
    // deliverDue() is global: reminders left due by other tests would be counted as well.
    db.jdbc.update(
        "UPDATE academic_reminder_job SET status='CANCELLED' WHERE user_id=? OR (status='PENDING'"
            + " AND fire_at<=now()+interval '1 day')",
        a.id());
    UUID job = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO academic_reminder_job(id,user_id,kind,source_id,occurrence_at,fire_at) VALUES"
            + " (?,?,'CLASS',?,now()+interval '2 hours',now()-interval '1 minute')",
        job,
        a.id(),
        series);
    var pool = java.util.concurrent.Executors.newFixedThreadPool(2);
    var start = new java.util.concurrent.CountDownLatch(1);
    var calls = new ArrayList<java.util.concurrent.Future<Integer>>();
    for (int i = 0; i < 2; i++)
      calls.add(
          pool.submit(
              () -> {
                start.await();
                return reminders.deliverDue();
              }));
    start.countDown();
    int sent = 0;
    for (var call : calls) sent += call.get();
    pool.shutdown();
    assertThat(sent).isEqualTo(1);
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM notification WHERE user_id=? AND kind='STUDY_REMINDER'",
                Integer.class,
                a.id()))
        .isEqualTo(1);
    var message =
        db.one("SELECT message,href FROM notification WHERE user_id=? AND kind='STUDY_REMINDER'", a.id());
    assertThat((String) message.get("message")).startsWith("Sua aula de ").contains(" começa às ");
    assertThat((String) message.get("href")).startsWith("/home?day=").endsWith("#enturma-study");
    assertThat(db.one("SELECT status FROM academic_reminder_job WHERE id=?", job)).containsEntry("status", "SENT");
  }

  @Test
  void quietHoursSendClassReminderBeforeSilence() {
    var routine = planner.routine(a);
    planner.saveRoutine(
        a,
        new Routine("America/Sao_Paulo", "19:00", "22:30", List.of(1, 2, 3, 4, 5), null, null, 120, "16:00", "18:00", "BALANCED", null, null, null));
    upcomingClass(a);
    var start = LocalDate.now(SP).plusDays(2).atTime(15, 59).atZone(SP).toInstant();
    assertThat(jobs(a, "PENDING").getFirst()).containsEntry("fireAt", start.toString());
    assertThat(routine).isNotNull();
  }

  @Test
  void zeroMinutesDisablesClassReminders() {
    upcomingClass(a);
    assertThat(jobs(a, "PENDING")).isNotEmpty();
    planner.saveRoutine(
        a,
        new Routine("America/Sao_Paulo", "08:00", "12:00", List.of(1, 2, 3, 4, 5), null, null, 0, null, null, "BALANCED", null, null, null));
    assertThat(jobs(a, "PENDING")).isEmpty();
  }

  @Test
  void lateJobForAClassThatAlreadyStartedIsNotSent() {
    UUID series = upcomingClass(a);
    db.jdbc.update("UPDATE academic_reminder_job SET status='CANCELLED' WHERE user_id=?", a.id());
    db.jdbc.update(
        "INSERT INTO academic_reminder_job(id,user_id,kind,source_id,occurrence_at,fire_at) VALUES"
            + " (?,?,'CLASS',?,now()-interval '5 minutes',now()-interval '2 hours')",
        UUID.randomUUID(),
        a.id(),
        series);
    reminders.deliverDue();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM notification WHERE user_id=? AND kind='STUDY_REMINDER'",
                Integer.class,
                a.id()))
        .isZero();
  }

  // ---------------------------------------------------------------- school breaks

  @SuppressWarnings("unchecked")
  static List<Map<String, Object>> vacations(Map<String, Object> calendar) {
    return (List<Map<String, Object>>) calendar.get("vacations");
  }

  static List<String> classDays(Map<String, Object> calendar) {
    return events(calendar).stream()
        .filter(e -> "CLASS".equals(e.get("kind")))
        .map(e -> (String) e.get("occursOn"))
        .toList();
  }

  @Test
  void defaultBreaksHideRegularClassesButKeepExtraOnes() {
    Actor c = user();
    UUID series = planner.addClasses(c, mondays(subject(c), "2026-06-01", null)).getFirst();
    var july = planner.calendar(c, d("2026-07-01"), d("2026-07-31"));
    assertThat(vacations(july))
        .anySatisfy(
            v ->
                assertThat(v)
                    .containsEntry("name", "Férias de julho")
                    .containsEntry("startsOn", "2026-07-01")
                    .containsEntry("endsOn", "2026-07-31"));
    assertThat(classDays(july)).isEmpty();
    assertThat(classDays(planner.calendar(c, d("2026-06-01"), d("2026-06-30")))).contains("2026-06-29");
    var january = planner.calendar(c, d("2027-01-01"), d("2027-01-31"));
    assertThat(vacations(january))
        .anySatisfy(
            v ->
                assertThat(v)
                    .containsEntry("name", "Férias de fim de ano")
                    .containsEntry("startsOn", "2026-12-20")
                    .containsEntry("endsOn", "2027-01-31"));
    assertThat(classDays(january)).isEmpty();
    planner.addException(
        c,
        series,
        new ClassException(d("2026-07-15"), "EXTRA", OffsetDateTime.parse("2026-07-15T19:00:00-03:00"), 120, "Reposição"));
    assertThat(events(planner.calendar(c, d("2026-07-01"), d("2026-07-31"))))
        .singleElement()
        .satisfies(e -> assertThat(e).containsEntry("status", "EXTRA"));
  }

  @Test
  void studentCanMoveAndRemoveBreaksWithoutThemComingBack() {
    Actor c = user();
    planner.addClasses(c, mondays(subject(c), "2026-06-01", null));
    var july = vacations(planner.calendar(c, d("2026-07-01"), d("2026-07-31")));
    UUID id =
        (UUID)
            july.stream().filter(v -> "Férias de julho".equals(v.get("name"))).findFirst().orElseThrow().get("id");
    planner.updateVacation(c, id, new Vacation(d("2026-07-15"), d("2026-07-31"), "Recesso"));
    assertThat(classDays(planner.calendar(c, d("2026-07-01"), d("2026-07-31"))))
        .containsExactly("2026-07-06", "2026-07-13");
    assertThatThrownBy(() -> planner.deleteVacation(b, id)).isInstanceOf(ApiException.class);
    planner.deleteVacation(c, id);
    assertThat(classDays(planner.calendar(c, d("2026-07-01"), d("2026-07-31")))).hasSize(4);
    assertThat(vacations(planner.calendar(c, d("2026-07-01"), d("2026-07-31"))))
        .noneMatch(v -> String.valueOf(v.get("startsOn")).startsWith("2026-07"));
    UUID own = planner.addVacation(c, new Vacation(d("2026-07-20"), d("2026-07-24"), "Semana de provas"));
    assertThat(own).isNotNull();
    assertThat(classDays(planner.calendar(c, d("2026-07-01"), d("2026-07-31"))))
        .containsExactly("2026-07-06", "2026-07-13", "2026-07-27");
    assertThatThrownBy(() -> planner.addVacation(c, new Vacation(d("2026-07-24"), d("2026-07-20"), "x")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.addVacation(c, new Vacation(d("2026-07-20"), d("2026-07-24"), "  ")))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.addVacation(c, new Vacation(d("2026-01-01"), d("2026-12-31"), "Ano")))
        .isInstanceOf(ApiException.class);
  }

  // ---------------------------------------------------------------- attendance

  /** A daily one-hour class that began two weeks ago, inside a semester around today. */
  Actor dailyStudent() {
    Actor c = noVacations(user());
    var today = LocalDate.now(SP);
    planner.saveRoutine(
        c,
        new Routine("America/Sao_Paulo", "08:00", "12:00", List.of(1, 2, 3, 4, 5), today.minusDays(14), today.plusDays(30), 120, null, null, "BALANCED", null, null, null));
    planner.addClasses(
        c, new ClassSeries(subject(c), List.of(1, 2, 3, 4, 5, 6, 7), "08:00", "09:00", today.minusDays(14), null, ""));
    return c;
  }

  @SuppressWarnings("unchecked")
  static List<Map<String, Object>> list(Map<String, Object> map, String key) {
    return (List<Map<String, Object>>) map.get(key);
  }

  static int count(Map<String, Object> map, String key) {
    return ((Number) map.get(key)).intValue();
  }

  Map<String, Object> pastClass(Actor c) {
    var today = LocalDate.now(SP);
    return events(planner.calendar(c, today.minusDays(7), today.minusDays(1))).stream()
        .filter(e -> "CLASS".equals(e.get("kind")) && !Boolean.TRUE.equals(e.get("holiday")))
        .reduce((first, second) -> second)
        .orElseThrow();
  }

  @Test
  void pastClassesCountAsAttendedUntilTheStudentMarksAnAbsence() {
    Actor c = dailyStudent();
    var before = planner.attendance(c);
    int present = count(before, "present");
    assertThat(present).isGreaterThanOrEqualTo(8);
    assertThat(count(before, "absent")).isZero();
    assertThat(before).containsEntry("estimated", false);
    var past = pastClass(c);
    assertThat(past).containsEntry("attendance", null);
    String key = (String) past.get("attendanceKey");
    planner.setAttendance(c, key, "ABSENT");
    var after = planner.attendance(c);
    assertThat(count(after, "present")).isEqualTo(present - 1);
    assertThat(count(after, "absent")).isEqualTo(1);
    assertThat(list(after, "subjects"))
        .singleElement()
        .satisfies(s -> assertThat(count(s, "absent")).isEqualTo(1));
    assertThat(pastClass(c)).containsEntry("attendance", "ABSENT");
    planner.setAttendance(c, key, "PRESENT");
    assertThat(count(planner.attendance(c), "absent")).isZero();
    assertThat(count(planner.attendance(c), "present")).isEqualTo(present);
    planner.clearAttendance(c, key);
    assertThat(pastClass(c)).containsEntry("attendance", null);
  }

  @Test
  void onlyStartedClassesOfTheStudentCanBeMarked() {
    Actor c = dailyStudent();
    var today = LocalDate.now(SP);
    String future =
        (String)
            events(planner.calendar(c, today.plusDays(2), today.plusDays(4))).getFirst().get("attendanceKey");
    assertThatThrownBy(() -> planner.setAttendance(c, future, "ABSENT")).isInstanceOf(ApiException.class);
    String key = (String) pastClass(c).get("attendanceKey");
    assertThatThrownBy(() -> planner.setAttendance(b, key, "ABSENT")).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.setAttendance(c, key, "MAYBE")).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> planner.setAttendance(c, "nonsense", "ABSENT")).isInstanceOf(ApiException.class);
  }

  @Test
  void recentUnansweredClassesAreAskedAbout() {
    Actor c = dailyStudent();
    // A daily class always leaves at least one non-holiday class in the last three days.
    var pending = list(planner.attendance(c), "pending");
    assertThat(pending).isNotEmpty().allSatisfy(e -> assertThat(e).containsEntry("attendance", null));
    String key = (String) pending.getFirst().get("attendanceKey");
    planner.setAttendance(c, key, "PRESENT");
    assertThat(list(planner.attendance(c), "pending")).noneMatch(e -> key.equals(e.get("attendanceKey")));
  }

  @Test
  void withoutASemesterTheCurrentHalfYearIsEstimated() {
    var summary = planner.attendance(a);
    var today = LocalDate.now(SP);
    assertThat(summary)
        .containsEntry("estimated", true)
        .containsEntry("semesterStart", (today.getMonthValue() <= 6 ? today.withDayOfYear(1) : today.withMonth(7).withDayOfMonth(1)).toString());
  }

  @Test
  void classStartAsksWhetherTheStudentIsThere() {
    var now = java.time.ZonedDateTime.now(SP);
    Assumptions.assumeTrue(now.toLocalTime().isAfter(LocalTime.of(0, 30)));
    var start = now.toLocalTime().minusMinutes(10).withSecond(0).withNano(0);
    UUID series =
        planner
            .addClasses(
                a,
                new ClassSeries(subject(a), List.of(now.getDayOfWeek().getValue()), start.toString(), "23:59", now.toLocalDate(), null, ""))
            .getFirst();
    var startsAt = now.toLocalDate().atTime(start).atZone(SP).toInstant().toString();
    assertThat(jobs(a, "PENDING", "ATTEND"))
        .anySatisfy(j -> assertThat(j).containsEntry("sourceId", series).containsEntry("occurrenceAt", startsAt).containsEntry("fireAt", startsAt));
    reminders.deliverDue();
    var message =
        db.one("SELECT message,href FROM notification WHERE user_id=? AND kind='STUDY_REMINDER'", a.id());
    assertThat((String) message.get("message")).contains("Você está na aula");
    assertThat((String) message.get("href")).contains("attendance=").endsWith("#enturma-study");
  }

  @Test
  void answeredClassIsNotAskedAgain() {
    var now = java.time.ZonedDateTime.now(SP);
    Assumptions.assumeTrue(now.toLocalTime().isAfter(LocalTime.of(0, 30)));
    var start = now.toLocalTime().minusMinutes(10).withSecond(0).withNano(0);
    planner.addClasses(
        a, new ClassSeries(subject(a), List.of(now.getDayOfWeek().getValue()), start.toString(), "23:59", now.toLocalDate(), null, ""));
    String key = (String) events(planner.calendar(a, now.toLocalDate(), now.toLocalDate())).getFirst().get("attendanceKey");
    planner.setAttendance(a, key, "PRESENT");
    reminders.deliverDue();
    assertThat(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM notification WHERE user_id=? AND kind='STUDY_REMINDER'", Integer.class, a.id()))
        .isZero();
  }

  // ---------------------------------------------------------------- duplicates

  @Test
  void theSameClassSavedTwiceShowsOnceAndIsAskedAboutOnce() {
    Actor c = dailyStudent();
    var today = LocalDate.now(SP);
    UUID subject = (UUID) pastClass(c).get("subjectId");
    // Two identical series, as a double submit or an older app version could leave behind.
    UUID twin = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO academic_class_schedule(id,user_id,subject_id,weekday,starts_at,ends_at,valid_from)"
            + " SELECT ?,user_id,subject_id,weekday,starts_at,ends_at,valid_from FROM"
            + " academic_class_schedule WHERE user_id=? AND weekday=?",
        twin,
        c.id(),
        today.minusDays(1).getDayOfWeek().getValue());
    var yesterday = events(planner.calendar(c, today.minusDays(1), today.minusDays(1)));
    assertThat(yesterday).filteredOn(e -> "CLASS".equals(e.get("kind"))).hasSize(1);
    var summary = planner.attendance(c);
    assertThat(list(summary, "pending"))
        .extracting(e -> e.get("occursOn"))
        .doesNotHaveDuplicates();
    assertThat(list(summary, "subjects")).singleElement();
    assertThat(subject).isNotNull();
  }

  @Test
  void anActionOnOneOfTheCopiesIsTheOneThatShows() {
    Actor c = dailyStudent();
    var today = LocalDate.now(SP);
    var day = today.plusDays(3);
    UUID twin = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO academic_class_schedule(id,user_id,subject_id,weekday,starts_at,ends_at,valid_from)"
            + " SELECT ?,user_id,subject_id,weekday,starts_at,ends_at,valid_from FROM"
            + " academic_class_schedule WHERE user_id=? AND weekday=?",
        twin,
        c.id(),
        day.getDayOfWeek().getValue());
    planner.addException(c, twin, new ClassException(day, "CANCELLED", null, null, ""));
    assertThat(events(planner.calendar(c, day, day)))
        .singleElement()
        .satisfies(e -> assertThat(e).containsEntry("status", "CANCELLED"));
  }

  @Test
  void savingAClassThatIsAlreadyInTheGradeIsRefused() {
    UUID subject = subject(a);
    planner.addClasses(a, mondays(subject, "2026-03-02", null));
    assertThatThrownBy(() -> planner.addClasses(a, mondays(subject, "2026-03-09", null)))
        .isInstanceOf(ApiException.class)
        .hasMessageContaining("já está na sua grade");
    // A different day in the same request is still saved.
    var ids =
        planner.addClasses(
            a, new ClassSeries(subject, List.of(1, 3), "19:00", "22:30", d("2026-03-02"), null, "Sala 12"));
    assertThat(ids).hasSize(1);
    assertThat(classDays(planner.calendar(a, d("2026-03-01"), d("2026-03-31"))))
        .doesNotHaveDuplicates()
        .contains("2026-03-02", "2026-03-04");
  }
}
