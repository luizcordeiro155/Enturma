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

  public RideService(Db db, CatalogService catalog) {
    this.db = db;
    this.catalog = catalog;
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
    return db.one("SELECT id,status FROM ride_match WHERE ride_id=? AND user_id=?", ride, a.id());
  }

  public Object matches(Actor a) {
    return db.list(
        "SELECT m.id,m.ride_id,m.user_id,m.status,CASE WHEN m.status='ACCEPTED' THEN"
            + " m.meeting_point ELSE NULL END"
            + " meeting_point,r.owner_id,r.origin_area,r.departure_at,r.status ride_status,u.name"
            + " passenger_name,o.name owner_name FROM ride_match m JOIN ride r ON r.id=m.ride_id"
            + " JOIN app_user u ON u.id=m.user_id JOIN app_user o ON o.id=r.owner_id WHERE"
            + " m.user_id=? OR r.owner_id=? ORDER BY m.created_at DESC LIMIT 50",
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
    if (!match.get("status").equals("PENDING")
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
    db.jdbc.update(
        "INSERT INTO notification(id,user_id,message) VALUES (?,?,?)",
        UUID.randomUUID(),
        match.get("userId"),
        "Sua carona foi aceita. Combine o ponto de encontro no chat privado.");
  }

  private Map<String, Object> access(Actor a, UUID id) {
    var m =
        db.one(
            "SELECT m.*,r.owner_id,r.status ride_status FROM ride_match m JOIN ride r ON"
                + " r.id=m.ride_id WHERE m.id=?",
            id);
    if ((!m.get("userId").equals(a.id()) && !m.get("ownerId").equals(a.id()))
        || !m.get("status").equals("ACCEPTED")) throw ApiException.forbidden();
    unblocked((UUID) m.get("userId"), (UUID) m.get("ownerId"));
    return m;
  }

  public Object messages(Actor a, UUID id, int page) {
    access(a, id);
    return db.list(
        "SELECT m.id,m.body,m.created_at,u.name FROM ride_message m JOIN app_user u ON"
            + " u.id=m.sender_id WHERE match_id=? ORDER BY created_at DESC,m.id LIMIT 30 OFFSET ?",
        id,
        Db.offset(page));
  }

  @Transactional
  public void message(Actor a, UUID id, String body) {
    var m = access(a, id);
    if (!m.get("rideStatus").equals("OPEN")) throw ApiException.invalid("Carona encerrada.");
    db.jdbc.update(
        "INSERT INTO ride_message VALUES (?,?,?,?,now())", UUID.randomUUID(), id, a.id(), body);
  }

  @Transactional
  public void meeting(Actor a, UUID id, String point) {
    var m = access(a, id);
    if (!m.get("rideStatus").equals("OPEN")) throw ApiException.invalid("Carona encerrada.");
    db.jdbc.update("UPDATE ride_match SET meeting_point=? WHERE id=?", point, id);
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
  }

  @Transactional
  public void review(Actor a, UUID id, int rating) {
    var m = access(a, id);
    if (!m.get("rideStatus").equals("COMPLETED"))
      throw ApiException.invalid("Avalie apenas após a conclusão da carona.");
    db.jdbc.update("INSERT INTO ride_review VALUES (?,?,?)", id, a.id(), rating);
  }
}
