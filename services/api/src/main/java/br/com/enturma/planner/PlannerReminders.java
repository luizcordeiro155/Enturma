package br.com.enturma.planner;

import br.com.enturma.common.Db;
import br.com.enturma.notifications.NotificationService;
import br.com.enturma.planner.PlannerService.PlannerChanged;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Class reminders kept in a database queue so restarts never lose or duplicate them: one job per
 * (student, class, start), regenerated on every planner change and delivered by a locking worker.
 */
@Service
public class PlannerReminders {
  static final int WINDOW_DAYS = 14;
  static final int STUDY_LEAD_MINUTES = 10;

  /** How long after a class starts the "are you there?" question is still worth sending. */
  static final Duration ASK_GRACE = Duration.ofHours(3);
  private static final DateTimeFormatter HOUR = DateTimeFormatter.ofPattern("HH:mm");
  private final Db db;
  private final PlannerService planner;
  private final NotificationService notifications;

  public PlannerReminders(Db db, PlannerService planner, NotificationService notifications) {
    this.db = db;
    this.planner = planner;
    this.notifications = notifications;
  }

  /** Runs inside the planner write's transaction, so jobs always match what was saved. */
  @EventListener
  public void onChange(PlannerChanged change) {
    reschedule(change.userId());
  }

  @Transactional
  public void reschedule(UUID user) {
    var routine = planner.routine(user);
    var zone = PlannerService.zone((String) routine.get("timezone"));
    int minutes = ((Number) routine.get("classReminderMinutes")).intValue();
    var keep = new ArrayList<String>();
    var asks = new ArrayList<String>();
    var now = Instant.now();
    var today = LocalDate.now(zone);
    var upcoming = planner.occurrences(user, today, today.plusDays(WINDOW_DAYS));
    for (var occurrence : upcoming) {
      if ("CANCELLED".equals(occurrence.get("status")) || occurrence.get("attendance") != null) continue;
      var starts = Instant.parse((String) occurrence.get("startsAt"));
      if (starts.plus(ASK_GRACE).isBefore(now)) continue;
      UUID source = (UUID) occurrence.get("scheduleId");
      db.jdbc.update(
          "INSERT INTO academic_reminder_job(id,user_id,kind,source_id,occurrence_at,fire_at)"
              + " VALUES (?,?,'ATTEND',?,?,?) ON CONFLICT(user_id,kind,source_id,occurrence_at) DO"
              + " UPDATE SET fire_at=EXCLUDED.fire_at,status='PENDING',lease_until=NULL WHERE"
              + " academic_reminder_job.status<>'SENT'",
          UUID.randomUUID(),
          user,
          source,
          OffsetDateTime.ofInstant(starts, ZoneOffset.UTC),
          OffsetDateTime.ofInstant(starts, ZoneOffset.UTC));
      asks.add(source + "@" + starts.getEpochSecond());
    }
    if (minutes > 0) {
      for (var occurrence : upcoming) {
        if ("CANCELLED".equals(occurrence.get("status"))) continue;
        var starts = Instant.parse((String) occurrence.get("startsAt"));
        if (!starts.isAfter(now)) continue;
        var fire =
            outsideQuietHours(
                starts.minus(Duration.ofMinutes(minutes)),
                zone,
                (String) routine.get("quietStart"),
                (String) routine.get("quietEnd"));
        UUID source = (UUID) occurrence.get("scheduleId");
        db.jdbc.update(
            "INSERT INTO academic_reminder_job(id,user_id,kind,source_id,occurrence_at,fire_at)"
                + " VALUES (?,?,'CLASS',?,?,?) ON CONFLICT(user_id,kind,source_id,occurrence_at) DO"
                + " UPDATE SET fire_at=EXCLUDED.fire_at,status='PENDING',lease_until=NULL WHERE"
                + " academic_reminder_job.status<>'SENT'",
            UUID.randomUUID(),
            user,
            source,
            OffsetDateTime.ofInstant(starts, ZoneOffset.UTC),
            OffsetDateTime.ofInstant(fire, ZoneOffset.UTC));
        keep.add(source + "@" + starts.getEpochSecond());
      }
    }
    var studies = new ArrayList<String>();
    for (var session :
        db.list(
            "SELECT id,starts_at FROM study_session WHERE user_id=? AND status='PLANNED' AND"
                + " starts_at>now() AND starts_at<now()+make_interval(days=>?)",
            user,
            WINDOW_DAYS)) {
      var starts = Instant.parse((String) session.get("startsAt"));
      var fire = starts.minus(Duration.ofMinutes(STUDY_LEAD_MINUTES));
      if (fire.isBefore(Instant.now())) fire = Instant.now();
      db.jdbc.update(
          "INSERT INTO academic_reminder_job(id,user_id,kind,source_id,occurrence_at,fire_at)"
              + " VALUES (?,?,'STUDY',?,?,?) ON CONFLICT(user_id,kind,source_id,occurrence_at) DO"
              + " UPDATE SET fire_at=EXCLUDED.fire_at,status='PENDING',lease_until=NULL WHERE"
              + " academic_reminder_job.status<>'SENT'",
          UUID.randomUUID(),
          user,
          session.get("id"),
          OffsetDateTime.ofInstant(starts, ZoneOffset.UTC),
          OffsetDateTime.ofInstant(fire, ZoneOffset.UTC));
      studies.add(session.get("id") + "@" + starts.getEpochSecond());
    }
    db.jdbc.update(
        "UPDATE academic_reminder_job SET status='CANCELLED' WHERE user_id=? AND kind='STUDY' AND"
            + " status='PENDING' AND NOT (source_id::text||'@'||extract(epoch FROM"
            + " occurrence_at)::bigint = ANY(?::text[]))",
        user,
        "{" + String.join(",", studies) + "}");
    db.jdbc.update(
        "UPDATE academic_reminder_job SET status='CANCELLED' WHERE user_id=? AND kind='CLASS' AND"
            + " status='PENDING' AND NOT (source_id::text||'@'||extract(epoch FROM"
            + " occurrence_at)::bigint = ANY(?::text[]))",
        user,
        "{" + String.join(",", keep) + "}");    db.jdbc.update(
        "UPDATE academic_reminder_job SET status='CANCELLED' WHERE user_id=? AND kind='ATTEND' AND"
            + " status='PENDING' AND NOT (source_id::text||'@'||extract(epoch FROM"
            + " occurrence_at)::bigint = ANY(?::text[]))",
        user,
        "{" + String.join(",", asks) + "}");
  }

  /** A class reminder that would land in quiet hours is sent just before they begin. */
  static Instant outsideQuietHours(Instant fire, ZoneId zone, String quietStart, String quietEnd) {
    if (quietStart == null || quietEnd == null) return fire;
    var start = LocalTime.parse(quietStart);
    var end = LocalTime.parse(quietEnd);
    var local = fire.atZone(zone);
    var time = local.toLocalTime();
    boolean quiet =
        start.isBefore(end)
            ? !time.isBefore(start) && time.isBefore(end)
            : !time.isBefore(start) || time.isBefore(end);
    if (!quiet) return fire;
    var day = local.toLocalDate();
    if (!start.isBefore(end) && time.isBefore(end)) day = day.minusDays(1);
    return day.atTime(start).atZone(zone).minusMinutes(1).toInstant();
  }

  /** Sends due reminders; returns how many were sent. Concurrent workers never share a job. */
  @Scheduled(
      fixedDelayString = "${enturma.planner.worker-delay:30000}",
      initialDelayString = "${enturma.planner.worker-delay:30000}")
  @Transactional
  public int deliverDue() {
    var due =
        db.list(
            "SELECT j.id,j.user_id,j.kind,j.source_id,j.occurrence_at,coalesce(s.name,st.name)"
                + " subject_name,ss.status study_status,coalesce(r.timezone,'America/Sao_Paulo')"
                + " timezone FROM academic_reminder_job j LEFT JOIN academic_class_schedule c ON"
                + " j.kind IN ('CLASS','ATTEND') AND c.id=j.source_id LEFT JOIN academic_entry s ON"
                + " s.id=c.subject_id"
                + " LEFT JOIN study_session ss ON j.kind='STUDY' AND ss.id=j.source_id LEFT JOIN"
                + " academic_entry st ON st.id=ss.subject_id LEFT JOIN academic_routine r ON"
                + " r.user_id=j.user_id WHERE"
                + " j.status='PENDING' AND j.fire_at<=now() AND (j.lease_until IS NULL OR"
                + " j.lease_until<now()) ORDER BY j.fire_at LIMIT 50 FOR UPDATE OF j SKIP LOCKED");
    int sent = 0;
    for (var job : due) {
      var starts = Instant.parse((String) job.get("occurrenceAt"));
      if ("ATTEND".equals(job.get("kind"))) {
        if (askAttendance(job, starts)) sent++;
        continue;
      }
      if (!starts.isAfter(Instant.now()) || job.get("subjectName") == null) {
        db.jdbc.update("UPDATE academic_reminder_job SET status='CANCELLED' WHERE id=?", job.get("id"));
        continue;
      }
      var local = starts.atZone(PlannerService.zone((String) job.get("timezone")));
      if ("STUDY".equals(job.get("kind"))) {
        if (!"PLANNED".equals(job.get("studyStatus"))) {
          db.jdbc.update("UPDATE academic_reminder_job SET status='CANCELLED' WHERE id=?", job.get("id"));
          continue;
        }
        notifications.send(
            null,
            (UUID) job.get("userId"),
            "STUDY_REMINDER",
            "study:session",
            (UUID) job.get("id"),
            "/study/" + job.get("sourceId"),
            "Hora de estudar " + job.get("subjectName") + " às " + HOUR.format(local)
                + ". Sua sala de estudo com a IA está pronta.");
        db.jdbc.update(
            "UPDATE academic_reminder_job SET status='SENT',sent_at=now(),attempts=attempts+1 WHERE"
                + " id=?",
            job.get("id"));
        sent++;
        continue;
      }
      notifications.send(
          null,
          (UUID) job.get("userId"),
          "STUDY_REMINDER",
          "study:class",
          (UUID) job.get("id"),
          "/home?day=" + local.toLocalDate() + "#enturma-study",
          "Sua aula de " + job.get("subjectName") + " começa às " + HOUR.format(local) + ".");
      db.jdbc.update(
          "UPDATE academic_reminder_job SET status='SENT',sent_at=now(),attempts=attempts+1 WHERE"
              + " id=?",
          job.get("id"));
      sent++;
    }
    return sent;
  }

  /** Asks at the start of a class whether the student is there, unless they already answered. */
  private boolean askAttendance(Map<String, Object> job, Instant starts) {
    UUID user = (UUID) job.get("userId");
    Map<String, Object> occurrence = null;
    if (job.get("subjectName") != null && !starts.plus(ASK_GRACE).isBefore(Instant.now())) {
      var day = starts.atZone(PlannerService.zone((String) job.get("timezone"))).toLocalDate();
      for (var o : planner.occurrences(user, day.minusDays(1), day.plusDays(1)))
        if (job.get("sourceId").equals(o.get("scheduleId")) && starts.toString().equals(o.get("startsAt")))
          occurrence = o;
    }
    if (occurrence == null
        || "CANCELLED".equals(occurrence.get("status"))
        || occurrence.get("attendance") != null) {
      db.jdbc.update("UPDATE academic_reminder_job SET status='CANCELLED' WHERE id=?", job.get("id"));
      return false;
    }
    var local = starts.atZone(PlannerService.zone((String) job.get("timezone")));
    notifications.send(
        null,
        user,
        "STUDY_REMINDER",
        "study:attendance",
        (UUID) job.get("id"),
        "/home?day="
            + local.toLocalDate()
            + "&attendance="
            + java.net.URLEncoder.encode((String) occurrence.get("attendanceKey"), java.nio.charset.StandardCharsets.UTF_8)
            + "#enturma-study",
        "Sua aula de " + job.get("subjectName") + " começou às " + HOUR.format(local)
            + ". Você está na aula? Toque para marcar presença ou falta.");
    db.jdbc.update(
        "UPDATE academic_reminder_job SET status='SENT',sent_at=now(),attempts=attempts+1 WHERE id=?",
        job.get("id"));
    return true;
  }

  /** Keeps the two-week window filled for everyone with classes. */
  @Scheduled(cron = "0 15 3 * * *", zone = "America/Sao_Paulo")
  public void extendWindow() {
    for (var row :
        db.list(
            "SELECT user_id FROM academic_class_schedule UNION SELECT user_id FROM study_session WHERE"
                + " status='PLANNED' AND starts_at>now()"))
      reschedule((UUID) row.get("userId"));
  }
}
