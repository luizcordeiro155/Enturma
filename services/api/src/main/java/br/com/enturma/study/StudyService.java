package br.com.enturma.study;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.AppChanged;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyService {
  private final Db db;
  private final CatalogService catalog;
  private final int maxMinutes;
  private final RoomEvents roomEvents;
  private final br.com.enturma.notifications.NotificationService notices;
  private final ApplicationEventPublisher events;

  @Value("${enturma.room-empty-grace-seconds:300}")
  private int graceSeconds = 300;

  public StudyService(
      Db db,
      CatalogService catalog,
      @Value("${enturma.room-max-minutes}") int maxMinutes,
      RoomEvents roomEvents,
      br.com.enturma.notifications.NotificationService notices,
      ApplicationEventPublisher events) {
    this.roomEvents = roomEvents;
    this.notices = notices;
    this.events = events;
    this.db = db;
    this.catalog = catalog;
    this.maxMinutes = maxMinutes;
  }

  private void roomsChanged() {
    events.publishEvent(new AppChanged("rooms_changed", Set.of()));
  }

  public List<Map<String, Object>> list(Actor a, UUID subject, int page) {
    return db.list(
        "SELECT r.*,s.name subject_name,(SELECT count(*) FROM room_participant p WHERE"
            + " p.room_id=r.id AND left_at IS NULL) participants FROM study_room r JOIN"
            + " academic_entry s ON s.id=r.subject_id WHERE r.status IN ('OPEN','ACTIVE') AND"
            + " ends_at>now() AND (?::uuid IS NULL OR subject_id=?) AND NOT EXISTS(SELECT 1 FROM"
            + " room_participant p JOIN user_block b ON (b.user_id=? AND b.blocked_id=p.user_id) OR"
            + " (b.blocked_id=? AND b.user_id=p.user_id) WHERE p.room_id=r.id AND p.left_at IS"
            + " NULL) ORDER BY r.created_at DESC,r.id LIMIT 30 OFFSET ?",
        subject,
        subject,
        a.id(),
        a.id(),
        Db.offset(page));
  }

  @Transactional
  public Map<String, Object> study(
      Actor a, UUID subject, UUID topic, String title, int minutes, int capacity) {
    return create(a, subject, topic, title, minutes, capacity, 0);
  }

  @Transactional
  public Map<String, Object> create(
      Actor a, UUID subject, UUID topic, String title, int minutes, int capacity, int days) {
    if (days < 0 || days > 5 || capacity < 2 || capacity > 30)
      throw ApiException.invalid("Duração ou capacidade inválida.");
    if (days == 0 && (!Set.of(25, 50, 60, 90, 120, 180).contains(minutes) || minutes > maxMinutes))
      throw ApiException.invalid("Duração não permitida.");
    catalog.verified(subject, "SUBJECT");
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=? AND subject_id=?)",
        a.id(),
        subject))
      throw ApiException.invalid("Selecione esta matéria no perfil acadêmico primeiro.");
    if (topic != null && !catalog.verified(topic, "TOPIC").get("parentId").equals(subject))
      throw ApiException.invalid("Tópico não pertence à matéria.");
    db.one("SELECT id FROM academic_entry WHERE id=? FOR UPDATE", subject);
    var matches =
        db.list(
            "SELECT r.id FROM study_room r WHERE subject_id=? AND topic_id IS NOT DISTINCT FROM ?"
                + " AND lifecycle=? AND NOT entries_locked AND status IN ('OPEN','ACTIVE') AND"
                + " ends_at>now() AND ((SELECT count(*) FROM room_participant p WHERE"
                + " p.room_id=r.id AND left_at IS NULL)<max_participants OR EXISTS(SELECT 1 FROM"
                + " room_participant p WHERE p.room_id=r.id AND p.user_id=? AND p.left_at IS NULL))"
                + " AND NOT EXISTS(SELECT 1 FROM room_participant p JOIN user_block b ON"
                + " (b.user_id=? AND b.blocked_id=p.user_id) OR (b.blocked_id=? AND"
                + " b.user_id=p.user_id) WHERE p.room_id=r.id AND p.left_at IS NULL) AND NOT"
                + " EXISTS(SELECT 1 FROM room_participant p WHERE p.room_id=r.id AND p.user_id=?"
                + " AND p.removed) ORDER BY created_at LIMIT 1 FOR UPDATE",
            subject,
            topic,
            days == 0 ? "QUICK" : "MULTIDAY",
            a.id(),
            a.id(),
            a.id(),
            a.id());
    boolean reused = days == 0 && !matches.isEmpty();
    UUID id = reused ? (UUID) matches.getFirst().get("id") : UUID.randomUUID();
    if (!reused)
      db.jdbc.update(
          "INSERT INTO"
              + " study_room(id,host_id,subject_id,topic_id,title,status,max_participants,ends_at)"
              + " VALUES (?,?,?,?,?,'OPEN',?,now()+(? * interval '1 minute'))",
          id,
          a.id(),
          subject,
          topic,
          title,
          capacity,
          minutes);
    if (!reused && days > 0)
      db.jdbc.update(
          "UPDATE study_room SET lifecycle='MULTIDAY',ends_at=created_at+(? * interval '1 day')"
              + " WHERE id=?",
          days,
          id);
    join(a, id);
    var result = detail(a, id);
    result.put("reused", reused);
    roomsChanged();
    return result;
  }

  @Transactional
  public void join(Actor a, UUID id) {
    var room = activeLocked(id);
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_participant p JOIN user_block b ON (b.user_id=? AND"
            + " b.blocked_id=p.user_id) OR (b.blocked_id=? AND b.user_id=p.user_id) WHERE"
            + " p.room_id=? AND p.left_at IS NULL)",
        a.id(),
        a.id(),
        id)) throw ApiException.forbidden();
    var membership =
        db.list("SELECT * FROM room_participant WHERE room_id=? AND user_id=?", id, a.id());
    if (Boolean.TRUE.equals(room.get("entriesLocked"))
        && (membership.isEmpty() || membership.getFirst().get("leftAt") != null))
      throw new ApiException(409, "ROOM_LOCKED", "As novas entradas estão fechadas.");
    if (!membership.isEmpty()) {
      if (Boolean.TRUE.equals(membership.getFirst().get("removed"))) throw ApiException.forbidden();
      if (membership.getFirst().get("leftAt") == null) {
        heartbeat(a, id);
        return;
      }
    }
    Long count =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM room_participant WHERE room_id=? AND left_at IS NULL",
            Long.class,
            id);
    if (count >= ((Number) room.get("maxParticipants")).intValue())
      throw new ApiException(409, "ROOM_FULL", "Esta turma está completa.");
    db.jdbc.update(
        "INSERT INTO room_participant(room_id,user_id,role) VALUES (?,?,?) ON"
            + " CONFLICT(room_id,user_id) DO UPDATE SET"
            + " left_at=NULL,joined_at=now(),last_seen_at=now()",
        id,
        a.id(),
        room.get("hostId").equals(a.id()) ? "HOST" : "MEMBER");
    db.jdbc.update("UPDATE study_room SET empty_since=NULL WHERE id=?", id);
    roomEvents.add(
        id,
        a.id(),
        "WELCOME",
        "Bem-vindo à turma! Respeite os colegas, compartilhe conhecimento e consulte os materiais.",
        "join:" + a.id() + ":" + java.time.Instant.now().getEpochSecond() / 60);
    roomsChanged();
  }

  public Map<String, Object> activeLocked(UUID id) {
    var room = db.one("SELECT * FROM study_room WHERE id=? FOR UPDATE", id);
    if (!Set.of("OPEN", "ACTIVE").contains(room.get("status"))
        || !java.time.Instant.parse((String) room.get("endsAt")).isAfter(java.time.Instant.now()))
      throw new ApiException(409, "ROOM_ENDED", "Esta sessão já terminou.");
    return room;
  }

  public void member(Actor a, UUID id) {
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM moderation_case c JOIN moderation_action m ON m.case_id=c.id"
            + " WHERE c.user_id=? AND m.revoked_at IS NULL AND (m.ends_at IS NULL OR"
            + " m.ends_at>now()) AND ((c.room_id IS NULL AND m.kind IN"
            + " ('BAN','SUSPENSION','RESTRICTION')) OR (c.room_id=? AND m.kind='KICK')))",
        a.id(),
        id)) throw ApiException.forbidden();
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_participant p JOIN study_room r ON r.id=p.room_id"
            + " WHERE p.room_id=? AND p.user_id=? AND NOT p.removed"
            + " AND (p.left_at IS NULL OR r.status='ENDED'))",
        id,
        a.id())) throw ApiException.forbidden();
  }

  public Map<String, Object> detail(Actor a, UUID id) {
    member(a, id);
    var r =
        db.one(
            "SELECT r.*,s.name subject_name FROM study_room r JOIN academic_entry s ON"
                + " s.id=r.subject_id WHERE r.id=?",
            id);
    r.put("systemEvents", roomEvents.list(id));
    r.put(
        "members",
        db.list(
            "SELECT p.user_id,u.name,u.username,u.accent_color,u.profile_details,u.avatar_bytes IS"
                + " NOT NULL has_avatar,p.role,p.joined_at,p.left_at,(p.last_seen_at>now()-interval"
                + " '90 seconds' AND p.left_at IS NULL) online FROM room_participant p JOIN"
                + " app_user u ON u.id=p.user_id WHERE p.room_id=? AND NOT p.removed ORDER BY"
                + " p.joined_at LIMIT 30",
            id));
    var mine =
        db.one(
            "SELECT joined_at,left_at FROM room_participant WHERE room_id=? AND user_id=? AND NOT"
                + " removed",
            id,
            a.id());
    r.put("joinedAt", mine.get("joinedAt"));
    r.put("leftAt", mine.get("leftAt"));
    r.put(
        "hasEarlierHistory",
        db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_message m JOIN room_participant p"
                + " ON p.room_id=m.room_id WHERE m.room_id=? AND p.user_id=?"
                + " AND m.created_at<p.joined_at)",
            id,
            a.id()));
    return r;
  }

  @Transactional
  public void end(Actor a, UUID id) {
    var room = db.one("SELECT * FROM study_room WHERE id=? FOR UPDATE", id);
    if (!room.get("hostId").equals(a.id()) && !a.admin()) throw ApiException.forbidden();
    finish(id);
  }

  @Transactional
  public void leave(Actor a, UUID id) {
    db.one("SELECT id FROM study_room WHERE id=? FOR UPDATE", id);
    int changed =
        db.jdbc.update(
            "UPDATE room_participant SET left_at=now() WHERE room_id=? AND user_id=? AND left_at IS"
                + " NULL AND NOT removed",
            id,
            a.id());
    if (changed == 0) return;
    roomEvents.add(
        id,
        a.id(),
        "FAREWELL",
        "Até a próxima! Sua contribuição fica com a turma.",
        "leave:" + a.id() + ":" + java.time.Instant.now().getEpochSecond() / 60);
    roomsChanged();
  }

  @Transactional
  public void remove(Actor a, UUID id, UUID user) {
    var r = activeLocked(id);
    if (!r.get("hostId").equals(a.id()) || user.equals(a.id())) throw ApiException.forbidden();
    db.jdbc.update(
        "UPDATE room_participant SET left_at=now(),removed=true WHERE room_id=? AND user_id=?",
        id,
        user);
    roomsChanged();
  }

  @Transactional
  public void heartbeat(Actor a, UUID id) {
    member(a, id);
    if (db.list(
            "SELECT id FROM study_room WHERE id=? AND status IN ('OPEN','ACTIVE') AND ends_at>now()"
                + " FOR UPDATE",
            id)
        .isEmpty()) return;
    db.jdbc.update(
        "UPDATE room_participant p SET study_seconds=study_seconds+CASE WHEN"
            + " last_seen_at>now()-interval '90 seconds' THEN"
            + " LEAST(60,GREATEST(0,floor(extract(epoch from now()-last_seen_at))::bigint)) ELSE 0"
            + " END,last_seen_at=now() FROM study_room r WHERE p.room_id=r.id AND p.room_id=? AND"
            + " p.user_id=? AND p.left_at IS NULL AND NOT p.removed AND r.status IN"
            + " ('OPEN','ACTIVE') AND r.ends_at>now()",
        id,
        a.id());
    db.jdbc.update(
        "UPDATE study_room SET empty_since=NULL WHERE id=? AND status IN ('OPEN','ACTIVE')", id);
  }

  @Transactional
  public void configure(Actor a, UUID id, String title, String topic, boolean locked) {
    var r = activeLocked(id);
    if (!r.get("hostId").equals(a.id())) throw ApiException.forbidden();
    if (title == null
        || title.isBlank()
        || title.length() > 150
        || topic == null
        || topic.length() > 500) throw ApiException.invalid("Nome ou tópico inválido.");
    db.jdbc.update(
        "UPDATE study_room SET title=?,topic_text=?,entries_locked=? WHERE id=?",
        title.strip(),
        topic.strip(),
        locked,
        id);
    roomsChanged();
  }

  private void announce(UUID id, String key, String message) {
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_system_event WHERE room_id=? AND event_key=?)", id, key))
      return;
    roomEvents.add(id, null, key, message, key);
    for (var p :
        db.list(
            "SELECT user_id FROM room_participant WHERE room_id=? AND NOT removed AND left_at IS"
                + " NULL",
            id))
      notices.send(
          null,
          (UUID) p.get("userId"),
          "ROOM_NOTICE",
          "room:" + id,
          UUID.nameUUIDFromBytes((id + key).getBytes(java.nio.charset.StandardCharsets.UTF_8)),
          "/rooms/" + id,
          message);
  }

  private void finish(UUID id) {
    if (db.jdbc.update(
            "UPDATE study_room SET status='ENDED',ended_at=now() WHERE id=? AND status IN"
                + " ('OPEN','ACTIVE')",
            id)
        > 0) {
      announce(
          id, "ROOM_ENDED", "O estudo desta sala chegou ao fim. O histórico continua disponível.");
      roomsChanged();
    }
  }

  @Scheduled(fixedDelay = 10000)
  @Transactional
  public void expire() {
    for (var r :
        db.list(
            "SELECT * FROM study_room WHERE status IN ('OPEN','ACTIVE') ORDER BY id FOR UPDATE SKIP"
                + " LOCKED")) {
      UUID id = (UUID) r.get("id");
      var now = java.time.Instant.now();
      var ends = java.time.Instant.parse((String) r.get("endsAt"));
      if (!ends.isAfter(now)) {
        finish(id);
        continue;
      }
      if ("MULTIDAY".equals(r.get("lifecycle"))) {
        long seconds = java.time.Duration.between(now, ends).getSeconds();
        if (seconds <= 3600)
          announce(id, "ROOM_EXPIRING_1H", "Sua sala encerra em menos de uma hora.");
        else if (seconds <= 86400
            && java.time.Duration.between(java.time.Instant.parse((String) r.get("createdAt")), now)
                    .toMinutes()
                >= 1) announce(id, "ROOM_EXPIRING_24H", "Sua sala encerra em menos de 24 horas.");
      } else {
        boolean present =
            db.exists(
                "SELECT EXISTS(SELECT 1 FROM room_participant WHERE room_id=? AND NOT removed AND"
                    + " left_at IS NULL AND last_seen_at>now()-interval '90 seconds')",
                id);
        if (present) db.jdbc.update("UPDATE study_room SET empty_since=NULL WHERE id=?", id);
        else if (r.get("emptySince") == null)
          db.jdbc.update("UPDATE study_room SET empty_since=now() WHERE id=?", id);
        else if (java.time.Instant.parse((String) r.get("emptySince"))
            .plusSeconds(Math.max(30, graceSeconds))
            .isBefore(now)) finish(id);
      }
    }
  }
}
