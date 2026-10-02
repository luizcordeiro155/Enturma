package br.com.enturma.community;

import br.com.enturma.common.Db;
import br.com.enturma.notifications.*;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AchievementService {
  private final Db db;
  private final NotificationService notices;
  private final ApplicationEventPublisher events;

  public AchievementService(Db db, NotificationService notices, ApplicationEventPublisher events) {
    this.db = db;
    this.notices = notices;
    this.events = events;
  }

  private long number(String sql, UUID user) {
    return db.jdbc.queryForObject(sql, Long.class, user);
  }

  public Map<String, Long> metrics(UUID user) {
    var m = new HashMap<String, Long>();
    m.put(
        "daily",
        number("SELECT count(*) FROM learning_mission WHERE user_id=? AND won", user)
            + number(
                "SELECT count(*) FROM academic_game_progress WHERE user_id=? AND daily AND"
                    + " completed_at IS NOT NULL",
                user));
    m.put(
        "games",
        number("SELECT count(*) FROM learning_progress WHERE user_id=? AND completed", user)
            + m.get("daily"));
    m.put(
        "streak",
        number("SELECT coalesce(max(longest_streak),0) FROM learning_stats WHERE user_id=?", user));
    m.put(
        "advanced",
        number(
                "SELECT count(*) FROM learning_mission WHERE user_id=? AND won AND difficulty>=4",
                user)
            + number(
                "SELECT count(*) FROM academic_game_progress WHERE user_id=? AND difficulty>=5 AND"
                    + " completed_at IS NOT NULL",
                user));
    m.put(
        "up",
        number(
            "SELECT coalesce(max(ups),0) FROM (SELECT count(*) ups FROM forum_entry e JOIN"
                + " forum_vote v ON v.entry_id=e.id AND v.value=1 AND v.user_id<>e.author_id WHERE"
                + " e.author_id=? AND e.root_id IS NULL AND NOT e.deleted GROUP BY e.id) s",
            user));
    m.put(
        "answerUp",
        number(
            "SELECT coalesce(max(ups),0) FROM (SELECT count(*) ups FROM forum_entry e JOIN"
                + " forum_vote v ON v.entry_id=e.id AND v.value=1 AND v.user_id<>e.author_id WHERE"
                + " e.author_id=? AND e.root_id IS NOT NULL AND NOT e.deleted GROUP BY e.id) s",
            user));
    m.put(
        "discussions",
        number(
            "SELECT count(DISTINCT root_id) FROM forum_entry WHERE author_id=? AND root_id IS NOT"
                + " NULL AND NOT deleted",
            user));
    m.put(
        "rooms",
        number(
            "SELECT count(DISTINCT room_id) FROM room_message WHERE user_id=? AND deleted_at IS"
                + " NULL",
            user));
    m.put(
        "minutes",
        number(
            "SELECT coalesce(sum(study_seconds)/60,0) FROM room_participant WHERE user_id=?",
            user));
    m.put(
        "notebooks",
        number(
            "SELECT count(DISTINCT n.id) FROM study_notebook n JOIN notebook_source s ON"
                + " s.notebook_id=n.id AND s.status='READY' JOIN notebook_generation g ON"
                + " g.notebook_id=n.id AND g.status='READY' WHERE n.user_id=?",
            user));
    m.put(
        "subjects",
        number(
            "SELECT count(DISTINCT r.subject_id) FROM room_message m JOIN study_room r ON"
                + " r.id=m.room_id WHERE m.user_id=? AND m.deleted_at IS NULL",
            user));
    m.put(
        "days",
        number(
            "SELECT count(DISTINCT created_at::date) FROM learning_xp_event WHERE user_id=? AND"
                + " reason<>'ACHIEVEMENT'",
            user));
    m.put(
        "veteran",
        m.get("days") >= 30
                && db.exists(
                    "SELECT EXISTS(SELECT 1 FROM app_user WHERE id=? AND created_at<=now()-interval"
                        + " '365 days')",
                    user)
            ? 1L
            : 0L);
    return m;
  }

  @Transactional
  public Object sync(UUID user) {
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", user);
    db.jdbc.update("INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", user);
    var metrics = metrics(user);
    var unlocked = new ArrayList<String>();
    for (var d : db.list("SELECT * FROM achievement_definition ORDER BY code")) {
      String code = (String) d.get("code");
      long value = metrics.getOrDefault(d.get("metric"), 0L);
      db.jdbc.update(
          "INSERT INTO achievement_progress(user_id,code,progress) VALUES (?,?,?) ON"
              + " CONFLICT(user_id,code) DO UPDATE SET progress=EXCLUDED.progress,updated_at=now()",
          user,
          code,
          value);
      if (value < ((Number) d.get("requirement")).longValue()) continue;
      if (db.jdbc.update(
              "INSERT INTO user_achievement(user_id,code,definition_version) VALUES (?,?,?) ON"
                  + " CONFLICT DO NOTHING",
              user,
              code,
              d.get("version"))
          == 0) continue;
      int xp = ((Number) d.get("xp")).intValue();
      if (db.jdbc.update(
              "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES"
                  + " (?,?,?,?,'ACHIEVEMENT') ON CONFLICT(user_id,event_key) DO NOTHING",
              UUID.randomUUID(),
              user,
              "achievement:" + code,
              xp)
          > 0)
        db.jdbc.update(
            "UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?",
            xp,
            user);
      notices.send(
          null,
          user,
          "ACHIEVEMENT",
          "achievement:" + code,
          UUID.nameUUIDFromBytes(code.getBytes(java.nio.charset.StandardCharsets.UTF_8)),
          "/profile",
          "Conquista desbloqueada: " + d.get("name"));
      unlocked.add(code);
    }
    if (!unlocked.isEmpty())
      events.publishEvent(new AppChanged("achievement_unlocked", Set.of(user)));
    return Map.of("unlocked", unlocked, "achievements", list(user), "stats", stats(user));
  }

  public Object list(UUID user) {
    return db.list(
        "SELECT d.*,coalesce(p.progress,0) progress,a.earned_at FROM achievement_definition d LEFT"
            + " JOIN user_achievement a ON a.code=d.code AND a.user_id=? LEFT JOIN"
            + " achievement_progress p ON p.code=d.code AND p.user_id=? ORDER BY a.earned_at DESC"
            + " NULLS LAST,d.category,d.requirement",
        user,
        user);
  }

  public Object stats(UUID user) {
    return db.one(
        "SELECT coalesce(s.total_xp,0) total_xp,coalesce(s.total_xp,0)/250+1"
            + " level,coalesce(s.current_streak,0) current_streak,coalesce(s.longest_streak,0)"
            + " longest_streak,(SELECT coalesce(sum(study_seconds),0)/60 FROM room_participant"
            + " WHERE user_id=u.id) study_minutes FROM app_user u LEFT JOIN learning_stats s ON"
            + " s.user_id=u.id WHERE u.id=?",
        user);
  }
}
