package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.auth.*;
import br.com.enturma.common.*;
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
}
