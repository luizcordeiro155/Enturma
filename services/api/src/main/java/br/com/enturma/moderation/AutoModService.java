package br.com.enturma.moderation;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.*;
import br.com.enturma.study.RoomEvents;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutoModService {
  private final Db db;
  private final RoomEvents rooms;
  private final org.springframework.context.ApplicationEventPublisher events;

  public AutoModService(
      Db db, RoomEvents rooms, org.springframework.context.ApplicationEventPublisher events) {
    this.db = db;
    this.rooms = rooms;
    this.events = events;
  }

  public void allowed(UUID user, UUID room) {
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM moderation_case c JOIN moderation_action a ON a.case_id=c.id"
            + " WHERE c.user_id=? AND (c.room_id=? OR c.room_id IS NULL) AND a.kind<>'WARNING' AND"
            + " a.revoked_at IS NULL AND (a.ends_at IS NULL OR a.ends_at>now()))",
        user,
        room)) throw new PenaltyException();
  }

  public void inspect(Actor actor, UUID room, String text) {
    allowed(actor.id(), room);
    String normalized =
        java.text.Normalizer.normalize(text.toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "");
    String rule = null;
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM room_message WHERE user_id=? AND created_at>now()-interval '10"
                + " seconds'",
            Long.class,
            actor.id())
        >= 6) rule = "FLOOD";
    if (text.length() > 8
        && db.jdbc.queryForObject(
                "SELECT count(*) FROM room_message WHERE user_id=? AND room_id=? AND"
                    + " lower(body)=lower(?) AND created_at>now()-interval '2 minutes'",
                Long.class,
                actor.id(),
                room,
                text)
            >= 2) rule = "REPETITION";
    if (Pattern.compile("@[^\\s@]+").matcher(text).results().count() > 8) rule = "MENTION_SPAM";
    if (normalized.matches(
            "(?s).*(envie|mande|informe).{0,40}(senha|codigo de verificacao|token de acesso).*")
        || normalized.matches("(?s).*pix.{0,40}(premio garantido|dobro do valor).*"))
      rule = "PHISHING";
    if (normalized.matches("(?s).*(vou te matar|se mata|vou te estuprar).*"))
      rule = "THREAT_OR_HARASSMENT";
    var links = Pattern.compile("https?://[^\\s<>]+").matcher(text);
    while (links.find())
      try {
        String host = java.net.URI.create(links.group()).getHost();
        if (host != null
            && db.exists(
                "SELECT EXISTS(SELECT 1 FROM moderation_blocked_host WHERE host=? OR ? LIKE"
                    + " '%.'||host)",
                host.toLowerCase(Locale.ROOT), host.toLowerCase(Locale.ROOT)))
          rule = "MALICIOUS_LINK";
      } catch (IllegalArgumentException ignored) {
      }
    if (rule == null) return;
    long count =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM moderation_case WHERE user_id=? AND room_id=? AND"
                + " created_at>now()-interval '1 day'",
            Long.class,
            actor.id(),
            room);
    String action = count >= 2 ? "MUTE" : "WARNING";
    String hash =
        br.com.enturma.auth.Tokens.hash(
            room
                + ":"
                + actor.id()
                + ":"
                + rule
                + ":"
                + normalized
                + ":"
                + java.time.Instant.now().getEpochSecond() / 60);
    create(
        actor.id(), room, rule, action, action.equals("MUTE") ? 15 : 0, "RULE", null, text, hash);
    throw new PenaltyException();
  }

  public UUID create(
      UUID user,
      UUID room,
      String rule,
      String kind,
      int minutes,
      String source,
      UUID responsible,
      String evidence,
      String key) {
    UUID id = UUID.randomUUID();
    int inserted =
        db.jdbc.update(
            "INSERT INTO moderation_case(id,user_id,room_id,rule,source,dedupe_key) VALUES"
                + " (?,?,?,?,?,?) ON CONFLICT(dedupe_key) DO NOTHING",
            id,
            user,
            room,
            rule,
            source,
            key);
    if (inserted == 0)
      return (UUID) db.one("SELECT id FROM moderation_case WHERE dedupe_key=?", key).get("id");
    db.jdbc.update(
        "INSERT INTO moderation_evidence(id,case_id,content) VALUES (?,?,?)",
        UUID.randomUUID(),
        id,
        evidence);
    db.jdbc.update(
        "INSERT INTO moderation_action(id,case_id,kind,ends_at,responsible_id) VALUES (?,?,?,CASE"
            + " WHEN ?>0 THEN now()+(? * interval '1 minute') ELSE NULL END,?)",
        UUID.randomUUID(),
        id,
        kind,
        minutes,
        minutes,
        responsible);
    if (room != null) {
      rooms.add(
          room,
          user,
          "MODERATION",
          "O Monitor Enturma aplicou uma medida de convivência. Consulte suas notificações.",
          "moderation:" + id);
      if (kind.equals("KICK"))
        db.jdbc.update(
            "UPDATE room_participant SET removed=true,left_at=now() WHERE room_id=? AND user_id=?",
            room,
            user);
    }
    events.publishEvent(new AppChanged("moderation_action", Set.of(user)));
    return id;
  }

  public Object mine(Actor a) {
    return db.list(
        "SELECT c.id,c.room_id,c.rule,c.created_at,c.status,c.appeal,a.kind,a.ends_at,a.revoked_at"
            + " FROM moderation_case c JOIN moderation_action a ON a.case_id=c.id WHERE c.user_id=?"
            + " ORDER BY c.created_at DESC LIMIT 50",
        a.id());
  }

  @Transactional
  public void appeal(Actor a, UUID id, String reason) {
    if (reason == null || reason.isBlank() || reason.length() > 2000)
      throw ApiException.invalid("Explique seu pedido de revisão.");
    if (db.jdbc.update(
            "UPDATE moderation_case SET appeal=?,appealed_at=now(),status='APPEALED' WHERE id=? AND"
                + " user_id=? AND reviewed_at IS NULL",
            reason,
            id,
            a.id())
        == 0) throw ApiException.forbidden();
  }

  @Transactional
  public void review(Actor a, UUID id, boolean revoke, String note) {
    if (!a.admin()) throw ApiException.forbidden();
    if (note == null || note.isBlank() || note.length() > 2000)
      throw ApiException.invalid("Registre a justificativa da revisão.");
    var c = db.one("SELECT * FROM moderation_case WHERE id=? FOR UPDATE", id);
    db.jdbc.update(
        "UPDATE moderation_case SET status=?,reviewed_by=?,review_note=?,reviewed_at=now() WHERE"
            + " id=?",
        revoke ? "REVOKED" : "CONFIRMED",
        a.id(),
        note,
        id);
    if (revoke) {
      db.jdbc.update("UPDATE moderation_action SET revoked_at=now() WHERE case_id=?", id);
      db.jdbc.update(
          "UPDATE room_participant SET removed=false WHERE room_id=? AND user_id=?",
          c.get("roomId"),
          c.get("userId"));
    }
    events.publishEvent(new AppChanged("moderation_action", Set.of((UUID) c.get("userId"))));
  }
}
