package br.com.enturma.planner;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Academic routine, recurring classes with exceptions, personal holidays and the calendar. */
@Service
public class PlannerService {
  public static final int MAX_RANGE_DAYS = 62;

  public record Routine(
      String timezone,
      String defaultStart,
      String defaultEnd,
      List<Integer> weekdays,
      LocalDate semesterStart,
      LocalDate semesterEnd,
      Integer classReminderMinutes,
      String quietStart,
      String quietEnd,
      String tutorPersonality,
      String state,
      String city) {}

  public record ClassSeries(
      UUID subjectId,
      List<Integer> weekdays,
      String startsAt,
      String endsAt,
      LocalDate validFrom,
      LocalDate validUntil,
      String room) {}

  public record ClassUpdate(
      int weekday,
      String startsAt,
      String endsAt,
      LocalDate validFrom,
      LocalDate validUntil,
      String room,
      int version) {}

  public record ClassException(
      LocalDate occursOn, String kind, OffsetDateTime movedTo, Integer minutes, String note) {}

  public record PersonalHoliday(LocalDate date, String name, String scope) {}

  public record PlannerTask(
      String kind, String title, UUID subjectId, OffsetDateTime dueAt, Integer minutes) {}

  /** Published after every change that can move a class or task in time. */
  public record PlannerChanged(UUID userId) {}

  private static final Set<String> TASK_KINDS = Set.of("EXAM", "ASSIGNMENT", "EVENT");
  private final Db db;
  private final ApplicationEventPublisher events;

  public PlannerService(Db db, ApplicationEventPublisher events) {
    this.db = db;
    this.events = events;
  }

  // ---------------------------------------------------------------- routine

  @Transactional
  public Map<String, Object> routine(Actor a) {
    return routine(a.id());
  }

  Map<String, Object> routine(UUID user) {
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM academic_routine WHERE user_id=?)", user)) {
      var shift =
          db.list("SELECT shift FROM academic_enrollment WHERE user_id=?", user).stream()
              .map(r -> (String) r.get("shift"))
              .findFirst()
              .orElse("");
      String start, end;
      switch (shift) {
        case "AFTERNOON" -> {
          start = "13:30";
          end = "17:30";
        }
        case "EVENING" -> {
          start = "19:00";
          end = "22:30";
        }
        default -> {
          start = "08:00";
          end = "12:00";
        }
      }
      var place =
          db.list(
                  "SELECT coalesce(c.state,i.state) state,coalesce(c.city,i.city) city FROM"
                      + " academic_identity ai LEFT JOIN academic_campus c ON c.id=ai.campus_id"
                      + " LEFT JOIN academic_institution i ON i.id=coalesce(ai.institution_id,"
                      + "c.institution_id) WHERE ai.user_id=?",
                  user)
              .stream()
              .findFirst()
              .orElse(Map.of());
      db.jdbc.update(
          "INSERT INTO academic_routine(user_id,default_start,default_end,state,city) VALUES"
              + " (?,?::time,?::time,?,?) ON CONFLICT(user_id) DO NOTHING",
          user,
          start,
          end,
          place.get("state"),
          place.get("city"));
    }
    var row =
        db.one(
            "SELECT timezone,to_char(default_start,'HH24:MI') default_start,"
                + "to_char(default_end,'HH24:MI') default_end,weekdays,semester_start,semester_end,"
                + "class_reminder_minutes,to_char(quiet_start,'HH24:MI') quiet_start,"
                + "to_char(quiet_end,'HH24:MI') quiet_end,tutor_personality,state,city,updated_at"
                + " FROM academic_routine WHERE user_id=?",
            user);
    int mask = ((Number) row.get("weekdays")).intValue();
    var days = new ArrayList<Integer>();
    for (int day = 1; day <= 7; day++) if ((mask & (1 << (day - 1))) != 0) days.add(day);
    row.put("weekdays", days);
    return row;
  }

  @Transactional
  public Map<String, Object> saveRoutine(Actor a, Routine r) {
    routine(a.id());
    zone(r.timezone());
    var start = time(r.defaultStart());
    var end = time(r.defaultEnd());
    if (!end.isAfter(start)) throw ApiException.invalid("O fim das aulas precisa ser depois do início.");
    int mask = 0;
    for (int day : r.weekdays() == null ? List.<Integer>of() : r.weekdays()) mask |= 1 << (weekday(day) - 1);
    if (r.semesterStart() != null
        && r.semesterEnd() != null
        && r.semesterEnd().isBefore(r.semesterStart()))
      throw ApiException.invalid("O fim do semestre precisa ser depois do início.");
    int reminder = r.classReminderMinutes() == null ? 120 : r.classReminderMinutes();
    if (reminder < 0 || reminder > 1440)
      throw ApiException.invalid("O lembrete de aula vai de 0 a 1440 minutos.");
    var quietStart = r.quietStart() == null || r.quietStart().isBlank() ? null : time(r.quietStart());
    var quietEnd = r.quietEnd() == null || r.quietEnd().isBlank() ? null : time(r.quietEnd());
    if ((quietStart == null) != (quietEnd == null))
      throw ApiException.invalid("Informe o início e o fim do horário de silêncio.");
    String personality = r.tutorPersonality() == null ? "BALANCED" : r.tutorPersonality();
    if (!Set.of("WELCOMING", "BALANCED", "DEMANDING").contains(personality))
      throw ApiException.invalid("Personalidade do tutor inválida.");
    String state = r.state() == null || r.state().isBlank() ? null : r.state().toUpperCase(Locale.ROOT);
    if (state != null && !state.matches("[A-Z]{2}")) throw ApiException.invalid("UF inválida.");
    db.jdbc.update(
        "UPDATE academic_routine SET timezone=?,default_start=?,default_end=?,weekdays=?,"
            + "semester_start=?,semester_end=?,class_reminder_minutes=?,quiet_start=?,quiet_end=?,"
            + "tutor_personality=?,state=?,city=?,updated_at=now() WHERE user_id=?",
        r.timezone() == null ? "America/Sao_Paulo" : r.timezone(),
        start,
        end,
        mask,
        r.semesterStart(),
        r.semesterEnd(),
        reminder,
        quietStart,
        quietEnd,
        personality,
        state,
        r.city() == null ? null : r.city().strip(),
        a.id());
    changed(a.id());
    return routine(a.id());
  }

  // ---------------------------------------------------------------- classes

  @Transactional
  public List<UUID> addClasses(Actor a, ClassSeries s) {
    requireSubject(a.id(), s.subjectId());
    if (s.weekdays() == null || s.weekdays().isEmpty())
      throw ApiException.invalid("Escolha pelo menos um dia da semana.");
    var start = time(s.startsAt());
    var end = time(s.endsAt());
    validateSeries(start, end, s.validFrom(), s.validUntil());
    var ids = new ArrayList<UUID>();
    for (int day : new TreeSet<>(s.weekdays())) {
      UUID id = UUID.randomUUID();
      db.jdbc.update(
          "INSERT INTO academic_class_schedule(id,user_id,subject_id,weekday,starts_at,ends_at,"
              + "valid_from,valid_until,room) VALUES (?,?,?,?,?,?,?,?,?)",
          id,
          a.id(),
          s.subjectId(),
          weekday(day),
          start,
          end,
          s.validFrom(),
          s.validUntil(),
          room(s.room()));
      ids.add(id);
    }
    changed(a.id());
    return ids;
  }

  @Transactional
  public void updateClass(Actor a, UUID id, ClassUpdate u) {
    var start = time(u.startsAt());
    var end = time(u.endsAt());
    validateSeries(start, end, u.validFrom(), u.validUntil());
    int updated =
        db.jdbc.update(
            "UPDATE academic_class_schedule SET weekday=?,starts_at=?,ends_at=?,valid_from=?,"
                + "valid_until=?,room=?,version=version+1 WHERE id=? AND user_id=? AND version=?",
            weekday(u.weekday()),
            start,
            end,
            u.validFrom(),
            u.validUntil(),
            room(u.room()),
            id,
            a.id(),
            u.version());
    if (updated == 0) {
      ownSeries(a.id(), id);
      throw new ApiException(409, "CLASS_CONFLICT", "Esta aula mudou em outro aparelho. Atualize e tente de novo.");
    }
    changed(a.id());
  }

  @Transactional
  public void deleteClass(Actor a, UUID id) {
    ownSeries(a.id(), id);
    db.jdbc.update("DELETE FROM academic_class_schedule WHERE id=? AND user_id=?", id, a.id());
    changed(a.id());
  }

  @Transactional
  public UUID addException(Actor a, UUID series, ClassException e) {
    var row = ownSeries(a.id(), series);
    if (e.occursOn() == null) throw ApiException.invalid("Informe o dia da aula.");
    String kind = e.kind() == null ? "" : e.kind();
    if (!Set.of("CANCELLED", "MOVED", "EXTRA").contains(kind))
      throw ApiException.invalid("Tipo de alteração inválido.");
    if (!kind.equals("CANCELLED") && e.movedTo() == null)
      throw ApiException.invalid("Informe o novo dia e horário.");
    if (e.minutes() != null && (e.minutes() < 5 || e.minutes() > 720))
      throw ApiException.invalid("A duração vai de 5 a 720 minutos.");
    if (!kind.equals("EXTRA")) {
      int weekday = ((Number) row.get("weekday")).intValue();
      if (e.occursOn().getDayOfWeek().getValue() != weekday)
        throw ApiException.invalid("Esta aula não acontece neste dia.");
    }
    UUID id = UUID.randomUUID();
    int inserted =
        db.jdbc.update(
            "INSERT INTO academic_class_exception(id,schedule_id,user_id,occurs_on,kind,moved_to,"
                + "minutes,note) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(schedule_id,occurs_on,kind)"
                + " DO NOTHING",
            id,
            series,
            a.id(),
            e.occursOn(),
            kind,
            e.movedTo(),
            e.minutes(),
            e.note() == null ? "" : e.note().strip().substring(0, Math.min(300, e.note().strip().length())));
    if (inserted == 0) throw ApiException.invalid("Esta aula já tem essa alteração.");
    changed(a.id());
    return id;
  }

  @Transactional
  public void deleteException(Actor a, UUID series, UUID id) {
    int deleted =
        db.jdbc.update(
            "DELETE FROM academic_class_exception WHERE id=? AND schedule_id=? AND user_id=?",
            id,
            series,
            a.id());
    if (deleted == 0) throw ApiException.missing();
    changed(a.id());
  }

  // ---------------------------------------------------------------- holidays and tasks

  @Transactional
  public UUID addHoliday(Actor a, PersonalHoliday h) {
    if (h.date() == null) throw ApiException.invalid("Informe a data do feriado.");
    String name = h.name() == null ? "" : h.name().strip();
    if (name.isEmpty() || name.length() > 120) throw ApiException.invalid("Dê um nome ao feriado.");
    String scope = h.scope() == null ? "CITY" : h.scope();
    if (!Set.of("CITY", "OPTIONAL").contains(scope)) throw ApiException.invalid("Tipo de feriado inválido.");
    UUID id = UUID.randomUUID();
    if (db.jdbc.update(
            "INSERT INTO calendar_holiday(id,user_id,date,name,scope) VALUES (?,?,?,?,?) ON"
                + " CONFLICT(user_id,date,name) DO NOTHING",
            id,
            a.id(),
            h.date(),
            name,
            scope)
        == 0) throw ApiException.invalid("Este feriado já está no seu calendário.");
    return id;
  }

  @Transactional
  public void deleteHoliday(Actor a, UUID id) {
    if (db.jdbc.update("DELETE FROM calendar_holiday WHERE id=? AND user_id=?", id, a.id()) == 0)
      throw ApiException.missing();
  }

  @Transactional
  public UUID addTask(Actor a, PlannerTask t) {
    validateTask(a.id(), t);
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO campus_task(id,user_id,subject_id,kind,title,due_at,estimated_minutes) VALUES"
            + " (?,?,?,?,?,?,?)",
        id,
        a.id(),
        t.subjectId(),
        t.kind(),
        t.title().strip(),
        t.dueAt(),
        t.minutes() == null ? 60 : t.minutes());
    changed(a.id());
    return id;
  }

  @Transactional
  public void updateTask(Actor a, UUID id, PlannerTask t) {
    validateTask(a.id(), t);
    if (db.jdbc.update(
            "UPDATE campus_task SET subject_id=?,kind=?,title=?,due_at=?,estimated_minutes=? WHERE"
                + " id=? AND user_id=?",
            t.subjectId(),
            t.kind(),
            t.title().strip(),
            t.dueAt(),
            t.minutes() == null ? 60 : t.minutes(),
            id,
            a.id())
        == 0) throw ApiException.missing();
    changed(a.id());
  }

  @Transactional
  public void deleteTask(Actor a, UUID id) {
    if (db.jdbc.update("DELETE FROM campus_task WHERE id=? AND user_id=?", id, a.id()) == 0)
      throw ApiException.missing();
    changed(a.id());
  }

  // ---------------------------------------------------------------- calendar

  @Transactional
  public Map<String, Object> calendar(Actor a, LocalDate from, LocalDate to) {
    range(from, to);
    var routine = routine(a.id());
    var zone = zone((String) routine.get("timezone"));
    var holidays = holidays(a.id(), from, to, (String) routine.get("state"));
    var holidayDates = new HashSet<String>();
    holidays.forEach(h -> holidayDates.add((String) h.get("date")));
    var events = new ArrayList<Map<String, Object>>();
    for (var occurrence : occurrences(a.id(), from, to, zone)) {
      occurrence.put("holiday", holidayDates.contains((String) occurrence.get("occursOn")));
      events.add(occurrence);
    }
    for (var task :
        db.list(
            "SELECT t.id,t.kind,t.title,t.subject_id,t.due_at,t.estimated_minutes,t.completed_at,"
                + "s.name subject_name FROM campus_task t LEFT JOIN academic_entry s ON"
                + " s.id=t.subject_id WHERE t.user_id=? AND t.due_at>=? AND t.due_at<? ORDER BY"
                + " t.due_at",
            a.id(),
            from.atStartOfDay(zone).toOffsetDateTime(),
            to.plusDays(1).atStartOfDay(zone).toOffsetDateTime())) {
      var starts = Instant.parse((String) task.get("dueAt"));
      var event = new LinkedHashMap<String, Object>();
      event.put("id", task.get("id"));
      event.put("kind", task.get("kind"));
      event.put("title", task.get("title"));
      event.put("subjectId", task.get("subjectId"));
      event.put("subjectName", task.get("subjectName"));
      event.put("startsAt", starts.toString());
      event.put(
          "endsAt",
          starts.plus(((Number) task.get("estimatedMinutes")).longValue(), ChronoUnit.MINUTES).toString());
      String date = starts.atZone(zone).toLocalDate().toString();
      event.put("occursOn", date);
      event.put("status", task.get("completedAt") == null ? "SCHEDULED" : "DONE");
      event.put("holiday", holidayDates.contains(date));
      events.add(event);
    }
    for (var study :
        db.list(
            "SELECT ss.id,ss.subject_id,s.name subject_name,ss.notebook_id,ss.starts_at,ss.minutes,"
                + "ss.goal,ss.status FROM study_session ss JOIN academic_entry s ON s.id=ss.subject_id"
                + " WHERE ss.user_id=? AND ss.starts_at>=? AND ss.starts_at<? ORDER BY ss.starts_at",
            a.id(),
            from.atStartOfDay(zone).toOffsetDateTime(),
            to.plusDays(1).atStartOfDay(zone).toOffsetDateTime())) {
      var starts = Instant.parse((String) study.get("startsAt"));
      var event = new LinkedHashMap<String, Object>();
      event.put("id", study.get("id"));
      event.put("kind", "STUDY");
      String goal = (String) study.get("goal");
      event.put("title", goal == null || goal.isBlank() ? "Estudar " + study.get("subjectName") : goal);
      event.put("subjectId", study.get("subjectId"));
      event.put("subjectName", study.get("subjectName"));
      event.put("notebookId", study.get("notebookId"));
      event.put("startsAt", starts.toString());
      event.put(
          "endsAt", starts.plus(((Number) study.get("minutes")).longValue(), ChronoUnit.MINUTES).toString());
      String date = starts.atZone(zone).toLocalDate().toString();
      event.put("occursOn", date);
      event.put(
          "status",
          switch ((String) study.get("status")) {
            case "DONE" -> "DONE";
            case "SKIPPED" -> "CANCELLED";
            case "ACTIVE" -> "ACTIVE";
            default -> "SCHEDULED";
          });
      event.put("holiday", holidayDates.contains(date));
      events.add(event);
    }
    events.sort(Comparator.comparing(e -> (String) e.get("startsAt")));
    var result = new LinkedHashMap<String, Object>();
    result.put("timezone", zone.getId());
    result.put("holidays", holidays);
    result.put("events", events);
    return result;
  }

  /** Class occurrences of a student between two dates, in the routine's time zone. */
  public List<Map<String, Object>> occurrences(UUID user, LocalDate from, LocalDate to) {
    return occurrences(user, from, to, zone((String) routine(user).get("timezone")));
  }

  private List<Map<String, Object>> occurrences(UUID user, LocalDate from, LocalDate to, ZoneId zone) {
    var series =
        db.list(
            "SELECT c.id,c.subject_id,s.name subject_name,c.weekday,to_char(c.starts_at,'HH24:MI')"
                + " starts_at,to_char(c.ends_at,'HH24:MI') ends_at,c.valid_from,c.valid_until,c.room,"
                + "c.version FROM academic_class_schedule c JOIN academic_entry s ON s.id=c.subject_id"
                + " WHERE c.user_id=? AND c.valid_from<=? AND (c.valid_until IS NULL OR"
                + " c.valid_until>=?)",
            user,
            to,
            from);
    var exceptions = new HashMap<String, Map<String, Object>>();
    var extras = new ArrayList<Map<String, Object>>();
    for (var e :
        db.list(
            "SELECT id,schedule_id,occurs_on,kind,moved_to,minutes,note FROM"
                + " academic_class_exception WHERE user_id=? AND occurs_on BETWEEN ? AND ?",
            user,
            from,
            to)) {
      if ("EXTRA".equals(e.get("kind"))) extras.add(e);
      else exceptions.put(e.get("scheduleId") + ":" + e.get("occursOn"), e);
    }
    var bySeries = new HashMap<Object, Map<String, Object>>();
    var result = new ArrayList<Map<String, Object>>();
    for (var s : series) {
      bySeries.put(s.get("id"), s);
      var start = LocalTime.parse((String) s.get("startsAt"));
      var end = LocalTime.parse((String) s.get("endsAt"));
      var weekday = DayOfWeek.of(((Number) s.get("weekday")).intValue());
      var first = max(from, LocalDate.parse((String) s.get("validFrom")));
      var last = s.get("validUntil") == null ? to : min(to, LocalDate.parse((String) s.get("validUntil")));
      for (var day = first.with(java.time.temporal.TemporalAdjusters.nextOrSame(weekday));
          !day.isAfter(last);
          day = day.plusWeeks(1)) {
        var event = classEvent(s, day);
        var exception = exceptions.get(s.get("id") + ":" + day);
        Instant starts = day.atTime(start).atZone(zone).toInstant();
        Instant ends = day.atTime(end).atZone(zone).toInstant();
        String status = "SCHEDULED";
        if (exception != null) {
          event.put("exceptionId", exception.get("id"));
          event.put("note", exception.get("note"));
          if ("CANCELLED".equals(exception.get("kind"))) status = "CANCELLED";
          else {
            status = "MOVED";
            long minutes =
                exception.get("minutes") == null
                    ? Duration.between(starts, ends).toMinutes()
                    : ((Number) exception.get("minutes")).longValue();
            starts = Instant.parse((String) exception.get("movedTo"));
            ends = starts.plus(minutes, ChronoUnit.MINUTES);
          }
        }
        event.put("startsAt", starts.toString());
        event.put("endsAt", ends.toString());
        event.put("status", status);
        result.add(event);
      }
    }
    for (var extra : extras) {
      var s =
          bySeries.computeIfAbsent(
              extra.get("scheduleId"),
              id ->
                  db.one(
                      "SELECT c.id,c.subject_id,s.name subject_name,c.room,c.version,"
                          + "to_char(c.starts_at,'HH24:MI') starts_at,to_char(c.ends_at,'HH24:MI')"
                          + " ends_at FROM academic_class_schedule c JOIN academic_entry s ON"
                          + " s.id=c.subject_id WHERE c.id=?",
                      id));
      var day = LocalDate.parse((String) extra.get("occursOn"));
      var event = classEvent(s, day);
      var starts = Instant.parse((String) extra.get("movedTo"));
      long minutes =
          extra.get("minutes") == null
              ? Duration.between(LocalTime.parse((String) s.get("startsAt")), LocalTime.parse((String) s.get("endsAt"))).toMinutes()
              : ((Number) extra.get("minutes")).longValue();
      event.put("exceptionId", extra.get("id"));
      event.put("note", extra.get("note"));
      event.put("startsAt", starts.toString());
      event.put("endsAt", starts.plus(minutes, ChronoUnit.MINUTES).toString());
      event.put("status", "EXTRA");
      result.add(event);
    }
    result.sort(Comparator.comparing(e -> (String) e.get("startsAt")));
    return result;
  }

  private static Map<String, Object> classEvent(Map<String, Object> s, LocalDate day) {
    var event = new LinkedHashMap<String, Object>();
    event.put("id", s.get("id") + ":" + day);
    event.put("kind", "CLASS");
    event.put("title", s.get("subjectName"));
    event.put("subjectId", s.get("subjectId"));
    event.put("subjectName", s.get("subjectName"));
    event.put("scheduleId", s.get("id"));
    event.put("version", s.get("version"));
    event.put("room", s.get("room"));
    event.put("occursOn", day.toString());
    return event;
  }

  private List<Map<String, Object>> holidays(UUID user, LocalDate from, LocalDate to, String state) {
    var result = new ArrayList<Map<String, Object>>();
    for (var h : BrazilHolidays.between(from, to, state)) {
      var row = new LinkedHashMap<String, Object>();
      row.put("date", h.date().toString());
      row.put("name", h.name());
      row.put("scope", h.scope());
      row.put("custom", false);
      result.add(row);
    }
    for (var h :
        db.list(
            "SELECT id,date,name,scope FROM calendar_holiday WHERE user_id=? AND date BETWEEN ? AND ?"
                + " ORDER BY date",
            user,
            from,
            to)) {
      h.put("custom", true);
      result.add(h);
    }
    result.sort(Comparator.comparing(h -> (String) h.get("date")));
    return result;
  }

  // ---------------------------------------------------------------- helpers

  private void changed(UUID user) {
    events.publishEvent(new PlannerChanged(user));
  }

  private void requireSubject(UUID user, UUID subject) {
    if (subject == null
        || !db.exists(
            "SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=? AND subject_id=?)",
            user,
            subject)) throw ApiException.invalid("Escolha uma das matérias do seu perfil acadêmico.");
  }

  private void validateTask(UUID user, PlannerTask t) {
    if (t.kind() == null || !TASK_KINDS.contains(t.kind())) throw ApiException.invalid("Tipo inválido.");
    if (t.title() == null || t.title().isBlank() || t.title().strip().length() > 180)
      throw ApiException.invalid("Dê um título de até 180 caracteres.");
    if (t.dueAt() == null) throw ApiException.invalid("Informe o dia e o horário.");
    if (t.minutes() != null && (t.minutes() < 5 || t.minutes() > 1440))
      throw ApiException.invalid("A duração vai de 5 a 1440 minutos.");
    if (t.subjectId() != null) requireSubject(user, t.subjectId());
  }

  private Map<String, Object> ownSeries(UUID user, UUID id) {
    return db.one("SELECT id,weekday FROM academic_class_schedule WHERE id=? AND user_id=?", id, user);
  }

  private static void validateSeries(LocalTime start, LocalTime end, LocalDate from, LocalDate until) {
    if (!end.isAfter(start)) throw ApiException.invalid("O fim da aula precisa ser depois do início.");
    if (from == null) throw ApiException.invalid("Informe quando as aulas começam.");
    if (until != null && until.isBefore(from))
      throw ApiException.invalid("O fim do período precisa ser depois do início.");
  }

  static void range(LocalDate from, LocalDate to) {
    if (from == null || to == null || to.isBefore(from))
      throw ApiException.invalid("Período inválido.");
    if (ChronoUnit.DAYS.between(from, to) > MAX_RANGE_DAYS)
      throw ApiException.invalid("Consulte no máximo dois meses por vez.");
  }

  private static int weekday(int day) {
    if (day < 1 || day > 7) throw ApiException.invalid("Dia da semana inválido.");
    return day;
  }

  private static LocalTime time(String value) {
    try {
      return LocalTime.parse(value == null ? "" : value);
    } catch (DateTimeParseException e) {
      throw ApiException.invalid("Horário inválido. Use HH:mm.");
    }
  }

  static ZoneId zone(String id) {
    try {
      return ZoneId.of(id == null ? "America/Sao_Paulo" : id);
    } catch (DateTimeException e) {
      throw ApiException.invalid("Fuso horário inválido.");
    }
  }

  private static String room(String room) {
    String value = room == null ? "" : room.strip();
    if (value.length() > 120) throw ApiException.invalid("Use até 120 caracteres para a sala.");
    return value;
  }

  private static LocalDate max(LocalDate a, LocalDate b) {
    return a.isAfter(b) ? a : b;
  }

  private static LocalDate min(LocalDate a, LocalDate b) {
    return a.isBefore(b) ? a : b;
  }
}
