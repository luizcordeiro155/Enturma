package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
import br.com.enturma.planner.AcademicTerms;
import br.com.enturma.planner.AcademicTerms.NewTerm;
import br.com.enturma.planner.PlannerService.*;
import br.com.enturma.users.ProfileService;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Semesters: each one keeps its dates, period and subjects; a new one asks for a new grade. */
@SpringBootTest(properties = "enturma.planner.worker-delay=3600000")
@org.springframework.test.annotation.DirtiesContext(
    classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.AFTER_CLASS)
class AcademicTermIntegrationTest {
  static final ZoneId SP = ZoneId.of("America/Sao_Paulo");
  @Autowired Db db;
  @Autowired AuthService auth;
  @Autowired ProfileService profiles;
  @Autowired PersonalDataExport personalExport;
  @Autowired AccountPrivacyController privacy;
  @Autowired br.com.enturma.planner.PlannerService planner;
  @Autowired AcademicTerms terms;
  Actor a, b;
  LocalDate today;

  Actor user() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    var student =
        auth.authenticate(
                auth.register("Estudante", "term_" + tag, tag + "@example.test", "password-12345", "JUnit")
                    .accessToken())
            .orElseThrow();
    db.jdbc.update(
        "INSERT INTO calendar_vacation_year(user_id,year) SELECT ?,y FROM generate_series(2020,2040) y",
        student.id());
    return student;
  }

  /** A verified period whose whole catalog chain is verified, with one of its subjects. */
  Map<String, Object> catalogPeriod() {
    return db.one(
        "SELECT p.id period,s.id subject FROM academic_entry s JOIN academic_entry p ON p.id=s.parent_id"
            + " AND p.kind='PERIOD' AND p.status='VERIFIED' JOIN academic_entry cu ON cu.id=p.parent_id"
            + " AND cu.status='VERIFIED' JOIN academic_entry co ON co.id=cu.parent_id AND"
            + " co.status='VERIFIED' JOIN academic_entry ca ON ca.id=co.parent_id AND"
            + " ca.status='VERIFIED' JOIN academic_entry i ON i.id=ca.parent_id AND i.status='VERIFIED'"
            + " WHERE s.kind='SUBJECT' AND s.status='VERIFIED' ORDER BY s.id LIMIT 1");
  }

  UUID enroll(Actor student) {
    var row = catalogPeriod();
    profiles.enroll(student, (UUID) row.get("period"), List.of((UUID) row.get("subject")), "EVENING", "");
    return (UUID) row.get("subject");
  }

  void semester(Actor student, LocalDate start, LocalDate end) {
    planner.saveRoutine(
        student,
        new Routine("America/Sao_Paulo", "19:00", "22:30", List.of(1, 2, 3, 4, 5), start, end, 120, null, null, "BALANCED", null, null, null));
  }

  @SuppressWarnings("unchecked")
  static Map<String, Object> current(Map<String, Object> overview) {
    return (Map<String, Object>) overview.get("current");
  }

  @SuppressWarnings("unchecked")
  static List<Map<String, Object>> list(Map<String, Object> map, String key) {
    return (List<Map<String, Object>>) map.get(key);
  }

  @BeforeEach
  void setup() {
    a = user();
    b = user();
    today = LocalDate.now(SP);
  }

  @Test
  void withoutDatesTheStudentIsAskedToSetTheSemester() {
    var overview = terms.overview(a);
    assertThat(overview).containsEntry("needs", "SET_DATES").containsEntry("current", null);
  }

  @Test
  void savingTheSemesterRecordsItWithTheCurrentSubjects() {
    UUID subject = enroll(a);
    semester(a, today.minusDays(30), today.plusDays(60));
    var overview = terms.overview(a);
    assertThat(overview).containsEntry("needs", "NONE");
    assertThat(current(overview))
        .containsEntry("startsOn", today.minusDays(30).toString())
        .containsEntry("endsOn", today.plusDays(60).toString())
        .containsEntry("subjectsConfirmed", true)
        .containsEntry("name", AcademicTerms.name(today.minusDays(30)));
    assertThat(list(current(overview), "subjects")).extracting(s -> s.get("id")).containsExactly(subject);
    assertThat(current(overview).get("periodName")).isNotNull();
    // Editing the dates edits this semester instead of creating another.
    semester(a, today.minusDays(20), today.plusDays(70));
    assertThat(list(terms.overview(a), "terms")).singleElement();
    assertThat(current(terms.overview(a))).containsEntry("startsOn", today.minusDays(20).toString());
  }

  @Test
  void anEndedSemesterAsksForTheNextOneWithSuggestedDates() {
    enroll(a);
    semester(a, LocalDate.of(2026, 3, 2), LocalDate.of(2026, 7, 10));
    var overview = terms.overview(a);
    assertThat(overview).containsEntry("needs", today.isAfter(LocalDate.of(2026, 7, 10)) ? "NEW_TERM" : "NONE");
    @SuppressWarnings("unchecked")
    var next = (Map<String, Object>) overview.get("suggestion");
    assertThat(next)
        .containsEntry("startsOn", "2026-08-03")
        .containsEntry("endsOn", "2026-12-18")
        .containsEntry("name", "2026.2");
    semester(a, LocalDate.of(2026, 8, 3), LocalDate.of(2026, 12, 18));
    @SuppressWarnings("unchecked")
    var after = (Map<String, Object>) terms.overview(a).get("suggestion");
    assertThat(after)
        .containsEntry("startsOn", "2027-02-01")
        .containsEntry("endsOn", "2027-06-30")
        .containsEntry("name", "2027.1");
  }

  @Test
  void aNewSemesterEndsTheOldGradeAndAsksForNewSubjects() {
    UUID subject = enroll(a);
    var oldStart = today.minusDays(150);
    var oldEnd = today.minusDays(10);
    semester(a, oldStart, oldEnd);
    UUID series =
        planner
            .addClasses(a, new ClassSeries(subject, List.of(1, 2, 3, 4, 5, 6, 7), "19:00", "20:00", oldStart, null, ""))
            .getFirst();
    // A class saved before the semester existed has no end; the new semester must stop it.
    db.jdbc.update("UPDATE academic_class_schedule SET valid_until=NULL WHERE id=?", series);
    assertThat(terms.overview(a)).containsEntry("needs", "NEW_TERM");
    UUID oldTerm = (UUID) current(terms.overview(a)).get("id");

    var start = today.minusDays(3);
    var end = today.plusDays(120);
    terms.start(a, new NewTerm(null, start, end));

    var overview = terms.overview(a);
    assertThat(overview).containsEntry("needs", "SUBJECTS");
    assertThat(current(overview))
        .containsEntry("startsOn", start.toString())
        .containsEntry("subjectsConfirmed", false);
    assertThat(list(overview, "terms")).hasSize(2);
    assertThat(list(overview, "terms"))
        .anySatisfy(
            t -> {
              assertThat(t).containsEntry("id", oldTerm);
              assertThat(list(t, "subjects")).extracting(s -> s.get("id")).containsExactly(subject);
            });
    assertThat(planner.routine(a))
        .containsEntry("semesterStart", start.toString())
        .containsEntry("semesterEnd", end.toString());
    assertThat(db.one("SELECT valid_until FROM academic_class_schedule WHERE id=?", series))
        .containsEntry("validUntil", start.minusDays(1).toString());
    assertThat(PlannerIntegrationTest.events(planner.calendar(a, start, start.plusDays(6)))).isEmpty();

    enroll(a);
    assertThat(terms.overview(a)).containsEntry("needs", "NONE");
    assertThat(current(terms.overview(a))).containsEntry("subjectsConfirmed", true);
  }

  @Test
  void aNewSemesterMustComeAfterTheCurrentOneAndBeASemester() {
    semester(a, today.minusDays(150), today.minusDays(10));
    assertThatThrownBy(() -> terms.start(a, new NewTerm(null, today.minusDays(200), today.plusDays(10))))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> terms.start(a, new NewTerm(null, today.plusDays(10), today)))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> terms.start(a, new NewTerm(null, today, today.plusDays(500))))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> terms.start(a, new NewTerm("x".repeat(41), today, today.plusDays(100))))
        .isInstanceOf(ApiException.class);
    // A student who never set dates can start one straight away.
    terms.start(b, new NewTerm("2026.2", today.minusDays(10), today.plusDays(100)));
    assertThat(current(terms.overview(b))).containsEntry("name", "2026.2");
  }

  @Test
  void classesWithoutAnEndStopWhenTheSemesterEnds() {
    UUID subject = enroll(a);
    semester(a, today.minusDays(10), today.plusDays(60));
    UUID series =
        planner.addClasses(a, new ClassSeries(subject, List.of(1), "19:00", "20:00", today, null, "")).getFirst();
    assertThat(db.one("SELECT valid_until FROM academic_class_schedule WHERE id=?", series))
        .containsEntry("validUntil", today.plusDays(60).toString());
  }

  @Test
  void attendanceCanBeSeenForAPastSemester() {
    UUID subject = enroll(a);
    var oldStart = today.minusDays(60);
    semester(a, oldStart, today.minusDays(5));
    planner.addClasses(a, new ClassSeries(subject, List.of(1, 2, 3, 4, 5, 6, 7), "08:00", "09:00", oldStart, null, ""));
    UUID oldTerm = (UUID) current(terms.overview(a)).get("id");
    terms.start(a, new NewTerm(null, today.minusDays(2), today.plusDays(100)));
    var past = planner.attendance(a, oldTerm);
    assertThat(past)
        .containsEntry("termId", oldTerm)
        .containsEntry("semesterStart", oldStart.toString())
        .containsEntry("estimated", false);
    assertThat(((Number) past.get("present")).intValue()).isGreaterThan(40);
    assertThat(list(past, "pending")).isEmpty();
    assertThatThrownBy(() -> planner.attendance(b, oldTerm)).isInstanceOf(ApiException.class);
  }

  @Test
  void enrollmentContextLeadsStraightToThePeriodStep() {
    assertThat(profiles.enrollmentContext(a)).isEmpty();
    enroll(a);
    assertThat(profiles.enrollmentContext(a))
        .extracting(e -> e.get("kind"))
        .containsExactly("INSTITUTION", "CAMPUS", "COURSE", "CURRICULUM");
  }

  @Test
  void semestersAreExportedAndDeletedWithTheAccount() {
    enroll(a);
    semester(a, today.minusDays(10), today.plusDays(60));
    assertThat(personalExport.sections()).contains("study-terms");
    @SuppressWarnings("unchecked")
    var items = (List<Object>) ((Map<String, Object>) personalExport.export(a, "study-terms", 0).getBody()).get("items");
    assertThat(items).hasSize(1);
    privacy.now(a);
    assertThat(db.jdbc.queryForObject("SELECT count(*) FROM academic_term WHERE user_id=?", Integer.class, a.id()))
        .isZero();
  }
}
