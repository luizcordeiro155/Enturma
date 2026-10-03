package br.com.enturma.rides;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RideService {
  private final Db db;
  private final CatalogService catalog;
  private final org.springframework.context.ApplicationEventPublisher events;
  private final br.com.enturma.notifications.NotificationService notices;

  public RideService(
      Db db,
      CatalogService catalog,
      org.springframework.context.ApplicationEventPublisher events,
      br.com.enturma.notifications.NotificationService notices) {
    this.db = db;
    this.catalog = catalog;
    this.events = events;
    this.notices = notices;
  }

  private void changed(UUID ride, boolean publicListing) {
    Set<UUID> users = new HashSet<>();
    users.add((UUID) db.one("SELECT owner_id FROM ride WHERE id=?", ride).get("ownerId"));
    for (var m : db.list("SELECT user_id FROM ride_match WHERE ride_id=?", ride))
      users.add((UUID) m.get("userId"));
    events.publishEvent(new RideChanged(Set.copyOf(users), publicListing));
  }

  private void matchChanged(UUID match) {
    var participants =
        db.one(
            "SELECT m.user_id,r.owner_id FROM ride_match m JOIN ride r ON r.id=m.ride_id WHERE"
                + " m.id=?",
            match);
    events.publishEvent(
        new RideChanged(
            Set.of(
                (UUID) participants.get("userId"),
                (UUID) participants.get("ownerId")),
            false));
  }

  private void unblocked(UUID a, UUID b) {
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR (user_id=?"
            + " AND blocked_id=?))",
        a,
        b,
        b,
        a)) throw ApiException.forbidden();
  }

  public Object list(Actor a, UUID campus, int page) {
    return db.list(
        "SELECT r.*,u.name,c.name campus_name FROM ride r JOIN app_user u ON u.id=r.owner_id JOIN"
            + " academic_entry c ON c.id=r.campus_id WHERE r.status='OPEN' AND r.departure_at>now()"
            + " AND (?::uuid IS NULL OR campus_id=?) AND NOT EXISTS(SELECT 1 FROM user_block WHERE"
            + " (user_id=? AND blocked_id=r.owner_id) OR (blocked_id=? AND user_id=r.owner_id))"
            + " ORDER BY departure_at,id LIMIT 30 OFFSET ?",
        campus,
        campus,
        a.id(),
        a.id(),
        Db.offset(page));
  }

  public Object mine(Actor a) {
    return db.list(
        "SELECT r.*,c.name campus_name FROM ride r JOIN academic_entry c ON c.id=r.campus_id WHERE"
            + " owner_id=? ORDER BY created_at DESC LIMIT 30",
        a.id());
  }

  @Transactional
  public Object create(
      Actor a,
      UUID campus,
      String type,
      String area,
      String direction,
      Instant departure,
      int seats) {
    catalog.verified(campus, "CAMPUS");
    if (!Set.of("OFFER", "REQUEST").contains(type)
        || !Set.of("TO_CAMPUS", "FROM_CAMPUS").contains(direction)
        || departure.isBefore(Instant.now())
        || departure.isAfter(Instant.now().plusSeconds(90 * 86400)))
      throw ApiException.invalid("Confira o tipo, a direção e o horário da carona.");
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride(id,owner_id,campus_id,type,origin_area,direction,departure_at,seats)"
            + " VALUES (?,?,?,?,?,?,?,?)",
        id,
        a.id(),
        campus,
        type,
        area,
        direction,
        java.sql.Timestamp.from(departure),
        seats);
    changed(id, true);
    return Map.of("id", id);
  }

  @Transactional
  public Object interest(Actor a, UUID ride) {
    var r = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", ride);
    unblocked(a.id(), (UUID) r.get("ownerId"));
    if (r.get("ownerId").equals(a.id())
        || !r.get("status").equals("OPEN")
        || Instant.parse((String) r.get("departureAt")).isBefore(Instant.now()))
      throw ApiException.invalid("Não é possível solicitar esta carona.");
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride_match(id,ride_id,user_id) VALUES (?,?,?) ON CONFLICT(ride_id,user_id) DO"
            + " NOTHING",
        id,
        ride,
        a.id());
    changed(ride, false);
    return db.one("SELECT id,status FROM ride_match WHERE ride_id=? AND user_id=?", ride, a.id());
  }

  public Object matches(Actor a) {
    return db.list(
        "SELECT m.id,m.ride_id,m.user_id,m.status,m.closed_at,m.purge_at,m.deleted_at,CASE WHEN"
            + " m.status='ACCEPTED' THEN m.meeting_point ELSE NULL END"
            + " meeting_point,r.owner_id,r.origin_area,r.departure_at,r.status ride_status,u.name"
            + " passenger_name,o.name owner_name FROM ride_match m JOIN ride r ON r.id=m.ride_id"
            + " JOIN app_user u ON u.id=m.user_id JOIN app_user o ON o.id=r.owner_id WHERE"
            + " (m.user_id=? OR r.owner_id=?) AND (m.deleted_at IS NULL OR (m.status='ACCEPTED' AND"
            + " r.status='OPEN' AND r.departure_at>now()-interval '24 hours')) ORDER BY"
            + " m.created_at DESC LIMIT 50",
        a.id(),
        a.id());
  }

  @Transactional
  public void accept(Actor a, UUID id) {
    var match = db.one("SELECT * FROM ride_match WHERE id=?", id);
    var ride = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", match.get("rideId"));
    match = db.one("SELECT * FROM ride_match WHERE id=? FOR UPDATE", id);
    if (!ride.get("ownerId").equals(a.id())) throw ApiException.forbidden();
    unblocked(a.id(), (UUID) match.get("userId"));
    if (match.get("status").equals("ACCEPTED")) return;
    if (match.get("deletedAt") != null
        || !match.get("status").equals("PENDING")
        || !ride.get("status").equals("OPEN")
        || Instant.parse((String) ride.get("departureAt")).isBefore(Instant.now()))
      throw ApiException.invalid("Este pedido não pode ser aceito.");
    Long count =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM ride_match WHERE ride_id=? AND status='ACCEPTED'",
            Long.class,
            ride.get("id"));
    if (count >= ((Number) ride.get("seats")).intValue())
      throw new ApiException(409, "RIDE_FULL", "Não há vagas disponíveis.");
    db.jdbc.update("UPDATE ride_match SET status='ACCEPTED' WHERE id=?", id);
    notices.send(
        a.id(),
        (UUID) match.get("userId"),
        "RIDE_ACCEPTED",
        "ride:" + ride.get("id"),
        id,
        "/caronas?match=" + id,
        "Sua carona foi aceita. Combine o ponto de encontro no chat privado.");
    changed((UUID) ride.get("id"), true);
  }

  private Map<String, Object> participant(Actor a, UUID id) {
    var initial = db.one("SELECT ride_id FROM ride_match WHERE id=?", id);
    db.one("SELECT id FROM ride WHERE id=? FOR UPDATE", initial.get("rideId"));
    var m =
        db.one(
            "SELECT m.*,r.owner_id,r.status ride_status,r.departure_at FROM ride_match m JOIN ride"
                + " r ON r.id=m.ride_id WHERE m.id=? FOR UPDATE OF m",
            id);
    if (!m.get("userId").equals(a.id()) && !m.get("ownerId").equals(a.id()))
      throw ApiException.forbidden();
    return m;
  }

  @Transactional
  public Map<String, Object> access(Actor a, UUID id) {
    var m = participant(a, id);
    if (!m.get("status").equals("ACCEPTED") || m.get("deletedAt") != null)
      throw ApiException.forbidden();
    unblocked((UUID) m.get("userId"), (UUID) m.get("ownerId"));
    return m;
  }

  public void requireOpen(Map<String, Object> m) {
    if (m.get("closedAt") != null
        || !m.get("rideStatus").equals("OPEN")
        || Instant.parse((String) m.get("departureAt")).plusSeconds(86400).isBefore(Instant.now()))
      throw ApiException.invalid(
          "Conversa encerrada. Não é possível enviar mensagens ou entrar na chamada.");
  }

  private void close(UUID id) {
    db.jdbc.update(
        "UPDATE ride_match SET"
            + " closed_at=coalesce(closed_at,now()),purge_at=coalesce(purge_at,now()+interval '24"
            + " hours') WHERE id=?",
        id);
    db.jdbc.update("UPDATE ride_voice SET cleaned=false,updated_at=now() WHERE match_id=?", id);
    matchChanged(id);
  }

  @Transactional
  public void closeConversation(Actor a, UUID id) {
    var m = participant(a, id);
    if (!m.get("status").equals("ACCEPTED"))
      throw ApiException.invalid("Este pedido não tem conversa ativa.");
    close(id);
  }

  @Transactional
  public void cancelMatch(Actor a, UUID id) {
    var m = participant(a, id);
    if (!m.get("rideStatus").equals("OPEN"))
      throw ApiException.invalid("A carona já foi encerrada.");
    if (Set.of("PENDING", "ACCEPTED").contains(m.get("status"))) {
      db.jdbc.update("UPDATE ride_match SET status='CANCELLED' WHERE id=?", id);
      close(id);
      UUID peer =
          (UUID) (a.id().equals(m.get("ownerId")) ? m.get("userId") : m.get("ownerId"));
      notices.send(
          a.id(),
          peer,
          "RIDE_CANCELLED",
          "ride:" + m.get("rideId"),
          id,
          "/caronas?match=" + id,
          "O pedido de carona foi cancelado. A conversa e a chamada foram encerradas.");
      changed((UUID) m.get("rideId"), true);
    }
  }

  @Transactional
  public void deleteConversation(Actor a, UUID id) {
    participant(a, id);
    close(id);
    purge(id);
  }

  private void purge(UUID id) {
    db.jdbc.update("DELETE FROM ride_message WHERE match_id=?", id);
    db.jdbc.update(
        "UPDATE ride_match SET meeting_point=NULL,deleted_at=coalesce(deleted_at,now()) WHERE id=?",
        id);
    matchChanged(id);
  }

  @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000, initialDelay = 15000)
  @Transactional
  public void cleanupConversations() {
    for (var r :
        db.list(
            "SELECT DISTINCT r.id FROM ride r JOIN ride_match m ON m.ride_id=r.id WHERE"
                + " m.deleted_at IS NULL AND ((m.closed_at IS NULL AND (r.status<>'OPEN' OR"
                + " r.departure_at<now()-interval '24 hours' OR m.status IN"
                + " ('CANCELLED','REJECTED'))) OR m.purge_at<=now()) ORDER BY r.id LIMIT 100")) {
      db.one("SELECT id FROM ride WHERE id=? FOR UPDATE", r.get("id"));
      for (var m :
          db.list(
              "SELECT m.id,m.closed_at,m.purge_at,r.status ride_status,r.departure_at FROM"
                  + " ride_match m JOIN ride r ON r.id=m.ride_id WHERE r.id=? AND m.deleted_at IS"
                  + " NULL FOR UPDATE OF m",
              r.get("id"))) {
        if (m.get("closedAt") == null
            && (!m.get("rideStatus").equals("OPEN")
                || Instant.parse((String) m.get("departureAt"))
                    .plusSeconds(86400)
                    .isBefore(Instant.now()))) close((UUID) m.get("id"));
        if (m.get("purgeAt") != null
            && !Instant.parse((String) m.get("purgeAt")).isAfter(Instant.now()))
          purge((UUID) m.get("id"));
      }
    }
  }

  @Transactional
  public Object messages(Actor a, UUID id, int page) {
    access(a, id);
    return db.list(
        "SELECT m.id,m.body,m.created_at,m.sender_id"
            + " user_id,u.name,u.accent_color,u.profile_details,u.avatar_bytes IS NOT NULL"
            + " has_avatar FROM ride_message m JOIN app_user u ON u.id=m.sender_id WHERE match_id=?"
            + " ORDER BY created_at DESC,m.id LIMIT 30 OFFSET ?",
        id,
        Db.offset(page));
  }

  @Transactional
  public void message(Actor a, UUID id, String body) {
    var m = access(a, id);
    requireOpen(m);
    UUID message = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride_message VALUES (?,?,?,?,now())", message, id, a.id(), body);
    UUID peer =
        (UUID) (a.id().equals(m.get("ownerId")) ? m.get("userId") : m.get("ownerId"));
    notices.send(
        a.id(),
        peer,
        "RIDE_MESSAGE",
        "ride-match:" + id,
        message,
        "/caronas?match=" + id,
        "Você recebeu uma nova mensagem na carona.");
    matchChanged(id);
  }

  @Transactional
  public void meeting(Actor a, UUID id, String point) {
    var m = access(a, id);
    requireOpen(m);
    db.jdbc.update("UPDATE ride_match SET meeting_point=? WHERE id=?", point, id);
    matchChanged(id);
  }

  @Transactional
  public void finish(Actor a, UUID id, boolean cancel) {
    var r = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", id);
    if (!r.get("ownerId").equals(a.id())) throw ApiException.forbidden();
    if (!cancel && Instant.parse((String) r.get("departureAt")).isAfter(Instant.now()))
      throw ApiException.invalid("A carona ainda não começou.");
    db.jdbc.update(
        "UPDATE ride SET status=? WHERE id=? AND status='OPEN'",
        cancel ? "CANCELLED" : "COMPLETED",
        id);
    for (var m :
        db.list("SELECT id FROM ride_match WHERE ride_id=? AND deleted_at IS NULL FOR UPDATE", id))
      close((UUID) m.get("id"));
    changed(id, true);
  }

  @Transactional
  public void review(Actor a, UUID id, int rating) {
    var m = access(a, id);
    if (!m.get("rideStatus").equals("COMPLETED"))
      throw ApiException.invalid("Avalie apenas após a conclusão da carona.");
    db.jdbc.update("INSERT INTO ride_review VALUES (?,?,?)", id, a.id(), rating);
  }
}
