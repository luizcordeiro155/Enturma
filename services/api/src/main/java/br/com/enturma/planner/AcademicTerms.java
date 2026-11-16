package br.com.enturma.planner;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.planner.PlannerService.PlannerChanged;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The student's semesters (períodos letivos). Each one keeps its dates, the course period and the
 * subjects of that time. A new semester ends the old grade and asks for the new subjects.
 */
@Service
public class AcademicTerms {
  /** Long enough for an annual course, short enough to catch a wrong year. */
  public static final int MAX_DAYS = 400;

  public record NewTerm(String name, LocalDate startsOn, LocalDate endsOn) {}

  private final Db db;
  private final PlannerService planner;
  private final ApplicationEventPublisher events;

  public AcademicTerms(Db db, PlannerService planner, ApplicationEventPublisher events) {
    this.db = db;
    this.planner = planner;
    this.events = events;
  }

  /** "2027.1" for a semester that starts in the first half of 2027, "2027.2" otherwise. */
  public static String name(LocalDate start) {
    return start.getYear() + "." + (start.getMonthValue() <= 6 ? 1 : 2);
  }

  /** Brazilian colleges start around the first Monday of February and of August. */
  static Map<String, Object> suggestion(LocalDate after) {
    LocalDate start, end;
    if (after.getMonthValue() <= 7) {
      start = LocalDate.of(after.getYear(), 8, 1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
      end = LocalDate.of(after.getYear(), 12, 18);
    } else {
      start = LocalDate.of(after.getYear() + 1, 2, 1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
      end = LocalDate.of(after.getYear() + 1, 6, 30);
    }
    var row = new LinkedHashMap<String, Object>();
    row.put("name", name(start));
    row.put("startsOn", start.toString());
    row.put("endsOn", end.toString());
    return row;
  }

  /**
   * Every semester, newest first, the current one and what the student still has to do: SET_DATES
   * (no semester yet), NEW_TERM (the semester ended), SUBJECTS (new semester without its subjects)
   * or NONE.
   */
  @Transactional
  public Map<String, Object> overview(Actor a) {
    var routine = planner.routine(a);
    var today = LocalDate.now(PlannerService.zone((String) routine.get("timezone")));
    var terms = new ArrayList<Map<String, Object>>();
    for (var t :
        db.list(
            "SELECT t.id,t.name,t.starts_on,t.ends_on,t.period_id,p.name period_name,"
                + "t.subjects_confirmed FROM academic_term t LEFT JOIN academic_entry p ON"
                + " p.id=t.period_id WHERE t.user_id=? ORDER BY t.starts_on DESC",
            a.id())) {
      t.put(
          "subjects",
          db.list(
              "SELECT e.id,e.name FROM academic_term t CROSS JOIN LATERAL"
                  + " jsonb_array_elements_text(t.subjects) s(id) JOIN academic_entry e ON"
                  + " e.id=s.id::uuid WHERE t.id=? ORDER BY e.name",
              t.get("id")));
      terms.add(t);
    }
    var current = terms.isEmpty() ? null : terms.getFirst();
    String needs = "NONE";
    if (current == null) needs = "SET_DATES";
    else if (LocalDate.parse((String) current.get("endsOn")).isBefore(today)) needs = "NEW_TERM";
    else if (!Boolean.TRUE.equals(current.get("subjectsConfirmed"))) needs = "SUBJECTS";
    var result = new LinkedHashMap<String, Object>();
    result.put("current", current);
    result.put("needs", needs);
    result.put(
        "suggestion",
        suggestion(current == null ? today : LocalDate.parse((String) current.get("endsOn"))));
    result.put("terms", terms);
    return result;
  }

  /**
   * Starts the next semester: the old grade stops the day before it begins, and the student is asked
   * for the new subjects. Nothing of the old semester is deleted.
   */
  @Transactional
  public Map<String, Object> start(Actor a, NewTerm t) {
    if (t == null || t.startsOn() == null || t.endsOn() == null)
      throw ApiException.invalid("Informe o início e o fim do novo semestre.");
    if (t.endsOn().isBefore(t.startsOn()))
      throw ApiException.invalid("O fim do semestre precisa ser depois do início.");
    if (ChronoUnit.DAYS.between(t.startsOn(), t.endsOn()) > MAX_DAYS)
      throw ApiException.invalid("Um semestre pode ter no máximo 400 dias.");
    String name = t.name() == null || t.name().isBlank() ? name(t.startsOn()) : t.name().strip();
    if (name.length() > 40) throw ApiException.invalid("Use até 40 caracteres no nome do semestre.");
    planner.routine(a);
    var current =
        db.list(
                "SELECT id,starts_on,ends_on FROM academic_term WHERE user_id=? ORDER BY starts_on DESC"
                    + " LIMIT 1 FOR UPDATE",
                a.id())
            .stream()
            .findFirst();
    if (current.isPresent()) {
      var currentStart = LocalDate.parse((String) current.get().get("startsOn"));
      if (!t.startsOn().isAfter(currentStart))
        throw ApiException.invalid("O novo semestre precisa começar depois do início do atual.");
      // Both semesters keep their dates; only an overlap is trimmed from the old one.
      db.jdbc.update(
          "UPDATE academic_term SET ends_on=LEAST(ends_on,?) WHERE id=?",
          t.startsOn().minusDays(1),
          current.get().get("id"));
    }
    // The old grade stops: the new semester brings its own classes.
    db.jdbc.update(
        "UPDATE academic_class_schedule SET valid_until=?,version=version+1 WHERE user_id=? AND"
            + " valid_from<? AND (valid_until IS NULL OR valid_until>=?)",
        t.startsOn().minusDays(1),
        a.id(),
        t.startsOn(),
        t.startsOn());
    db.jdbc.update(
        "INSERT INTO academic_term(id,user_id,name,starts_on,ends_on) VALUES (?,?,?,?,?)",
        UUID.randomUUID(),
        a.id(),
        name,
        t.startsOn(),
        t.endsOn());
    db.jdbc.update(
        "UPDATE academic_routine SET semester_start=?,semester_end=?,updated_at=now() WHERE user_id=?",
        t.startsOn(),
        t.endsOn(),
        a.id());
    events.publishEvent(new PlannerChanged(a.id()));
    return overview(a);
  }
}
