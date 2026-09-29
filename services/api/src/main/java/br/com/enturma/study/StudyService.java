package br.com.enturma.study;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyService {
  private final Db db;
  private final CatalogService catalog;
  private final int maxMinutes;

  public StudyService(
      Db db, CatalogService catalog, @Value("${enturma.room-max-minutes}") int maxMinutes) {
    this.db = db;
    this.catalog = catalog;
    this.maxMinutes = maxMinutes;
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
    if (!Set.of(25, 50, 60, 90, 120, 180).contains(minutes) || minutes > maxMinutes)
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
                + " AND status IN ('OPEN','ACTIVE') AND ends_at>now() AND ((SELECT count(*) FROM"
                + " room_participant p WHERE p.room_id=r.id AND left_at IS NULL)<max_participants"
                + " OR EXISTS(SELECT 1 FROM room_participant p WHERE p.room_id=r.id AND p.user_id=?"
                + " AND p.left_at IS NULL)) AND NOT EXISTS(SELECT 1 FROM room_participant p JOIN"
                + " user_block b ON (b.user_id=? AND b.blocked_id=p.user_id) OR (b.blocked_id=? AND"
                + " b.user_id=p.user_id) WHERE p.room_id=r.id AND p.left_at IS NULL) AND NOT"
                + " EXISTS(SELECT 1 FROM room_participant p WHERE p.room_id=r.id AND p.user_id=?"
                + " AND p.removed) ORDER BY created_at LIMIT 1 FOR UPDATE",
            subject,
            topic,
            a.id(),
            a.id(),
            a.id(),
            a.id());
    boolean reused = !matches.isEmpty();
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
    join(a, id);
    var result = detail(a, id);
    result.put("reused", reused);
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
    if (!membership.isEmpty()) {
      if (Boolean.TRUE.equals(membership.getFirst().get("removed"))) throw ApiException.forbidden();
      if (membership.getFirst().get("leftAt") == null) return;
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
            + " CONFLICT(room_id,user_id) DO UPDATE SET left_at=NULL,joined_at=now()",
        id,
        a.id(),
        room.get("hostId").equals(a.id()) ? "HOST" : "MEMBER");
  }

  public Map<String, Object> activeLocked(UUID id) {
    var room = db.one("SELECT * FROM study_room WHERE id=? FOR UPDATE", id);
    if (!Set.of("OPEN", "ACTIVE").contains(room.get("status"))
        || !java.time.Instant.parse((String) room.get("endsAt")).isAfter(java.time.Instant.now()))
      throw new ApiException(409, "ROOM_ENDED", "Esta sessão já terminou.");
    return room;
  }

  public void member(Actor a, UUID id) {
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_participant WHERE room_id=? AND user_id=? AND left_at IS"
            + " NULL AND NOT removed)",
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
    r.put(
        "members",
        db.list(
            "SELECT p.user_id,u.name,u.username,u.bio,u.accent_color,"
                + " u.avatar_bytes IS NOT NULL has_avatar,u.banner_bytes IS NOT NULL has_banner,"
                + " p.role FROM room_participant p JOIN app_user u ON u.id=p.user_id"
                + " WHERE p.room_id=? AND p.left_at IS NULL ORDER BY joined_at LIMIT 30",
            id));
    return r;
  }

  @Transactional
  public void end(Actor a, UUID id) {
    var room = db.one("SELECT * FROM study_room WHERE id=? FOR UPDATE", id);
    if (!room.get("hostId").equals(a.id()) && !a.admin()) throw ApiException.forbidden();
    db.jdbc.update(
        "UPDATE study_room SET status='ENDED',ended_at=now() WHERE id=? AND status IN"
            + " ('OPEN','ACTIVE')",
        id);
  }

  @Transactional
  public void leave(Actor a, UUID id) {
    db.one("SELECT id FROM study_room WHERE id=? FOR UPDATE", id);
    db.jdbc.update(
        "UPDATE room_participant SET left_at=now() WHERE room_id=? AND user_id=?", id, a.id());
  }

  @Transactional
  public void remove(Actor a, UUID id, UUID user) {
    var r = activeLocked(id);
    if (!r.get("hostId").equals(a.id()) || user.equals(a.id())) throw ApiException.forbidden();
    db.jdbc.update(
        "UPDATE room_participant SET left_at=now(),removed=true WHERE room_id=? AND user_id=?",
        id,
        user);
  }

  @Scheduled(fixedDelay = 10000)
  @Transactional
  public void expire() {
    db.jdbc.update(
        "UPDATE study_room SET status='ENDED',ended_at=ends_at WHERE ends_at<=now() AND status IN"
            + " ('OPEN','ACTIVE')");
  }
}
