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
    for (var m :
        db.list(
            "SELECT driver_id,passenger_id FROM ride_match WHERE ride_id=?",
            ride)) {
      if (m.get("driverId") != null) users.add((UUID) m.get("driverId"));
      if (m.get("passengerId") != null) users.add((UUID) m.get("passengerId"));
    }
    events.publishEvent(new RideChanged(Set.copyOf(users), publicListing));
  }

  private void matchChanged(UUID match) {
    var participants =
        db.one(
            "SELECT driver_id,passenger_id FROM ride_match WHERE id=?",
            match);
    events.publishEvent(
        new RideChanged(
            Set.of(
                (UUID) participants.get("driverId"),
                (UUID) participants.get("passengerId")),
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
        "SELECT r.id,r.owner_id,r.campus_id,r.type,r.origin_area,r.direction,r.departure_at,"
            + " r.seats,r.status,r.trip_status,r.created_at,u.name,c.name campus_name,"
            + " coalesce(rep.rating,0) owner_rating,coalesce(rep.reviews,0) owner_reviews,"
            + " v.brand vehicle_brand,v.model vehicle_model,v.color vehicle_color,"
            + " (SELECT count(*) FROM ride_match m WHERE m.ride_id=r.id AND m.status='ACCEPTED')"
            + " accepted_seats FROM ride r"
            + " JOIN app_user u ON u.id=r.owner_id"
            + " JOIN academic_entry c ON c.id=r.campus_id"
            + " LEFT JOIN ride_reputation_summary rep ON rep.reviewee_id=r.owner_id"
            + " LEFT JOIN ride_vehicle_profile v ON v.user_id=r.owner_id"
            + " WHERE r.status='OPEN' AND r.departure_at>now()"
            + " AND coalesce(r.dispatch_mode,'SCHEDULED')='SCHEDULED'"
            + " AND NOT (r.type='REQUEST' AND EXISTS(SELECT 1 FROM ride_match mx"
            + " WHERE (mx.ride_id=r.id OR mx.request_ride_id=r.id)"
            + " AND mx.status='ACCEPTED'))"
            + " AND (?::uuid IS NULL OR r.campus_id=?)"
            + " AND NOT EXISTS(SELECT 1 FROM user_block WHERE"
            + " (user_id=? AND blocked_id=r.owner_id) OR (blocked_id=? AND user_id=r.owner_id))"
            + " ORDER BY r.departure_at,r.id LIMIT 30 OFFSET ?",
        campus,
        campus,
        a.id(),
        a.id(),
        Db.offset(page));
  }

  public Object mine(Actor a) {
    return db.list(
        "SELECT r.*,c.name campus_name,"
            + " (SELECT count(*) FROM ride_match m WHERE m.ride_id=r.id AND m.status='ACCEPTED')"
            + " accepted_seats,"
            + " (SELECT count(*) FROM ride_match m WHERE m.ride_id=r.id AND m.status='WAITLISTED')"
            + " waitlisted_seats"
            + " FROM ride r JOIN academic_entry c ON c.id=r.campus_id WHERE"
            + " r.owner_id=? ORDER BY r.created_at DESC LIMIT 50",
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
    return create(a, campus, type, area, direction, departure, seats, null, null, null);
  }

  @Transactional
  public Object create(
      Actor a,
      UUID campus,
      String type,
      String area,
      String direction,
      Instant departure,
      int seats,
      Double areaLat,
      Double areaLng,
      Integer areaAccuracyMeters) {
    catalog.verified(campus, "CAMPUS");
    if (!Set.of("OFFER", "REQUEST").contains(type)
        || !Set.of("TO_CAMPUS", "FROM_CAMPUS").contains(direction)
        || area == null
        || area.isBlank()
        || area.length() > 120
        || departure == null
        || departure.isBefore(Instant.now())
        || departure.isAfter(Instant.now().plusSeconds(90 * 86400))
        || seats < 1
        || seats > 8)
      throw ApiException.invalid("Confira o tipo, a região, a direção e o horário da carona.");
    if ((areaLat == null) != (areaLng == null))
      throw ApiException.invalid("A localização aproximada está incompleta.");
    if (areaLat != null
        && (areaLat < -90 || areaLat > 90 || areaLng < -180 || areaLng > 180))
      throw ApiException.invalid("A localização aproximada é inválida.");
    if (areaAccuracyMeters != null && (areaAccuracyMeters < 0 || areaAccuracyMeters > 50000))
      throw ApiException.invalid("A precisão da localização é inválida.");

    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride(id,owner_id,campus_id,type,origin_area,direction,departure_at,seats,"
            + " area_lat,area_lng,area_accuracy_m,trip_status)"
            + " VALUES (?,?,?,?,?,?,?,?,?,?,?,'MATCHING')",
        id,
        a.id(),
        campus,
        type,
        area.strip(),
        direction,
        java.sql.Timestamp.from(departure),
        seats,
        snap(areaLat),
        snap(areaLng),
        areaAccuracyMeters);
    changed(id, true);
    return Map.of("id", id);
  }

  @Transactional
  public Object interest(Actor a, UUID ride) {
    var r = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", ride);
    UUID owner = (UUID) r.get("ownerId");
    unblocked(a.id(), owner);
    if (owner.equals(a.id())
        || !r.get("status").equals("OPEN")
        || Instant.parse((String) r.get("departureAt")).isBefore(Instant.now()))
      throw ApiException.invalid("Não é possível solicitar esta carona.");

    boolean offer = "OFFER".equals(r.get("type"));
    if (!offer
        && db.exists(
            "SELECT EXISTS(SELECT 1 FROM ride_match WHERE ride_id=? AND status='ACCEPTED')",
            ride))
      throw ApiException.invalid("Este pedido de carona já encontrou um motorista.");
    UUID driver = offer ? owner : a.id();
    UUID passenger = offer ? a.id() : owner;
    int accepted =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM ride_match WHERE ride_id=? AND status='ACCEPTED'",
            Integer.class,
            ride);
    String status = offer && accepted >= ((Number) r.get("seats")).intValue() ? "WAITLISTED" : "PENDING";
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride_match(id,ride_id,user_id,status,requested_by,driver_id,passenger_id,"
            + " driver_confirmed,passenger_confirmed)"
            + " VALUES (?,?,?,?,?,?,?,?,?)"
            + " ON CONFLICT(ride_id,user_id)"
            + " WHERE status IN ('PENDING','WAITLISTED','ACCEPTED') AND deleted_at IS NULL"
            + " DO NOTHING",
        id,
        ride,
        a.id(),
        status,
        a.id(),
        driver,
        passenger,
        a.id().equals(driver),
        a.id().equals(passenger));
    var result =
        db.one(
            "SELECT id,status FROM ride_match WHERE ride_id=? AND user_id=?"
                + " AND status IN ('PENDING','WAITLISTED','ACCEPTED') AND deleted_at IS NULL"
                + " ORDER BY created_at DESC,id DESC LIMIT 1",
            ride,
            a.id());
    notices.send(
        a.id(),
        owner,
        "RIDE_REQUESTED",
        "ride:" + ride,
        (UUID) result.get("id"),
        "/caronas/matches?match=" + result.get("id"),
        status.equals("WAITLISTED")
            ? "Um estudante entrou na lista de espera da sua carona."
            : "Um estudante demonstrou interesse na sua carona.");
    changed(ride, false);
    return result;
  }

  public Object matches(Actor a) {
    return db.list(
        "SELECT m.id,m.ride_id,m.user_id,m.driver_id,m.passenger_id,m.requested_by,m.request_ride_id,"
            + " m.status,m.driver_confirmed,m.passenger_confirmed,m.boarded_at,m.pickup_order,"
            + " m.closed_at,m.purge_at,m.deleted_at,"
            + " CASE WHEN m.status='ACCEPTED' THEN m.meeting_point ELSE NULL END meeting_point,"
            + " CASE WHEN m.status='ACCEPTED' AND m.passenger_id=? THEN m.boarding_code ELSE NULL END"
            + " boarding_code,r.owner_id,r.origin_area,r.departure_at,r.status ride_status,"
            + " r.trip_status,r.campus_id,c.name campus_name,"
            + " p.name passenger_name,d.name driver_name,o.name owner_name,"
            + " v.brand vehicle_brand,v.model vehicle_model,v.color vehicle_color,"
            + " coalesce(rep.rating,0) peer_rating,coalesce(rep.reviews,0) peer_reviews"
            + " FROM ride_match m"
            + " JOIN ride r ON r.id=m.ride_id"
            + " JOIN academic_entry c ON c.id=r.campus_id"
            + " JOIN app_user p ON p.id=m.passenger_id"
            + " JOIN app_user d ON d.id=m.driver_id"
            + " JOIN app_user o ON o.id=r.owner_id"
            + " LEFT JOIN ride_vehicle_profile v ON v.user_id=m.driver_id"
            + " LEFT JOIN ride_reputation_summary rep ON rep.reviewee_id="
            + " CASE WHEN ?=m.driver_id THEN m.passenger_id ELSE m.driver_id END"
            + " WHERE (?=m.driver_id OR ?=m.passenger_id)"
            + " AND (m.deleted_at IS NULL OR (m.status='ACCEPTED' AND r.status='OPEN'"
            + " AND r.departure_at>now()-interval '24 hours'))"
            + " ORDER BY m.created_at DESC LIMIT 80",
        a.id(),
        a.id(),
        a.id(),
        a.id());
  }

  @Transactional
  public void accept(Actor a, UUID id) {
    var match =
        db.one(
            "SELECT * FROM ride_match WHERE id=? FOR UPDATE",
            id);
    var ride = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", match.get("rideId"));
    UUID driver = (UUID) match.get("driverId");
    UUID passenger = (UUID) match.get("passengerId");
    if (!a.id().equals(driver) && !a.id().equals(passenger)) throw ApiException.forbidden();
    if (a.id().equals(match.get("requestedBy")))
      throw ApiException.invalid("A outra pessoa precisa aceitar este pedido.");
    unblocked(driver, passenger);
    if (match.get("status").equals("ACCEPTED")) return;
    if (match.get("deletedAt") != null
        || !Set.of("PENDING", "WAITLISTED").contains(match.get("status"))
        || !ride.get("status").equals("OPEN")
        || Instant.parse((String) ride.get("departureAt")).isBefore(Instant.now()))
      throw ApiException.invalid("Este pedido não pode ser aceito.");

    Long count =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM ride_match WHERE ride_id=? AND status='ACCEPTED'",
            Long.class,
            ride.get("id"));
    if (count >= ((Number) ride.get("seats")).intValue()) {
      db.jdbc.update("UPDATE ride_match SET status='WAITLISTED' WHERE id=?", id);
      notices.send(
          a.id(),
          (UUID) match.get("requestedBy"),
          "RIDE_WAITLIST",
          "ride:" + ride.get("id"),
          id,
          "/caronas/matches?match=" + id,
          "A carona lotou antes do aceite. Seu pedido entrou na lista de espera.");
      changed((UUID) ride.get("id"), true);
      return;
    }

    db.jdbc.update(
        "UPDATE ride_match SET status='ACCEPTED',"
            + " driver_confirmed=CASE WHEN driver_id=? THEN true ELSE driver_confirmed END,"
            + " passenger_confirmed=CASE WHEN passenger_id=? THEN true ELSE passenger_confirmed END"
            + " WHERE id=?",
        a.id(),
        a.id(),
        id);
    if (match.get("requestRideId") != null)
      db.jdbc.update(
          "UPDATE ride SET status='COMPLETED' WHERE id=? AND status='OPEN'",
          match.get("requestRideId"));
    notices.send(
        a.id(),
        (UUID) match.get("requestedBy"),
        "RIDE_ACCEPTED",
        "ride:" + ride.get("id"),
        id,
        "/caronas/matches?match=" + id,
        "Sua combinação de carona foi aceita. Combine o ponto de encontro no chat privado.");
    changed((UUID) ride.get("id"), true);
  }

  private Map<String, Object> participant(Actor a, UUID id) {
    var initial = db.one("SELECT ride_id FROM ride_match WHERE id=?", id);
    db.one("SELECT id FROM ride WHERE id=? FOR UPDATE", initial.get("rideId"));
    var m =
        db.one(
            "SELECT m.*,r.owner_id,r.status ride_status,r.trip_status,r.departure_at,r.type,"
                + " r.dispatch_mode"
                + " FROM ride_match m JOIN ride r ON r.id=m.ride_id WHERE m.id=? FOR UPDATE OF m",
            id);
    if (!m.get("driverId").equals(a.id()) && !m.get("passengerId").equals(a.id()))
      throw ApiException.forbidden();
    return m;
  }

  @Transactional
  public Map<String, Object> access(Actor a, UUID id) {
    var m = participant(a, id);
    if (!m.get("status").equals("ACCEPTED") || m.get("deletedAt") != null)
      throw ApiException.forbidden();
    unblocked((UUID) m.get("driverId"), (UUID) m.get("passengerId"));
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
    db.jdbc.update("DELETE FROM ride_live_location WHERE match_id=?", id);
    db.jdbc.update(
        "UPDATE ride_safety_share SET revoked_at=coalesce(revoked_at,now())"
            + " WHERE match_id=? AND revoked_at IS NULL",
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
    if (Set.of("PENDING", "WAITLISTED", "ACCEPTED").contains(m.get("status"))) {
      boolean released = m.get("status").equals("ACCEPTED");
      db.jdbc.update("UPDATE ride_match SET status='CANCELLED' WHERE id=?", id);
      boolean onDemand = "ON_DEMAND".equals(m.get("dispatchMode"));
      if (m.get("requestRideId") != null
          && Instant.parse((String) m.get("departureAt")).isAfter(Instant.now())) {
        if (onDemand && a.id().equals(m.get("passengerId")))
          db.jdbc.update(
              "UPDATE ride SET status='CANCELLED',trip_status='CANCELLED'"
                  + " WHERE id=? AND status='COMPLETED'",
              m.get("requestRideId"));
        else
          db.jdbc.update(
              "UPDATE ride SET status='OPEN',trip_status='MATCHING'"
                  + " WHERE id=? AND status='COMPLETED'",
              m.get("requestRideId"));
      }
      if (onDemand) {
        db.jdbc.update(
            "UPDATE ride SET status='CANCELLED',trip_status='CANCELLED'"
                + " WHERE id=? AND status='OPEN'",
            m.get("rideId"));
        db.jdbc.update(
            "UPDATE ride_dispatch_attempt SET outcome='CANCELLED',updated_at=now()"
                + " WHERE match_id=? OR (request_ride_id=? AND driver_id=?)",
            id,
            m.get("requestRideId"),
            m.get("driverId"));
      }
      close(id);
      UUID peer =
          (UUID) (a.id().equals(m.get("driverId")) ? m.get("passengerId") : m.get("driverId"));
      notices.send(
          a.id(),
          peer,
          "RIDE_CANCELLED",
          "ride:" + m.get("rideId"),
          id,
          "/caronas/matches?match=" + id,
          "O pedido de carona foi cancelado. A conversa e a chamada foram encerradas.");
      if (onDemand)
        db.jdbc.update(
            "UPDATE ride_driver_availability SET status='ONLINE',offer_ride_id=NULL,"
                + " pending_match_id=NULL,updated_at=now() WHERE user_id=? AND enabled=true",
            m.get("driverId"));
      else if (a.id().equals(m.get("driverId")))
        db.jdbc.update(
            "UPDATE ride_driver_availability SET status='ONLINE',offer_ride_id=NULL,"
                + " pending_match_id=NULL,updated_at=now() WHERE user_id=? AND enabled=true",
            a.id());
      if (released) promoteWaitlist((UUID) m.get("rideId"));
      changed((UUID) m.get("rideId"), true);
    }
  }

  private void promoteWaitlist(UUID rideId) {
    var rows =
        db.list(
            "SELECT id,driver_id,passenger_id,requested_by FROM ride_match"
                + " WHERE ride_id=? AND status='WAITLISTED' AND deleted_at IS NULL"
                + " ORDER BY created_at,id LIMIT 1 FOR UPDATE SKIP LOCKED",
            rideId);
    if (rows.isEmpty()) return;
    var next = rows.getFirst();
    UUID id = (UUID) next.get("id");
    db.jdbc.update("UPDATE ride_match SET status='PENDING' WHERE id=?", id);
    for (UUID user :
        Set.of((UUID) next.get("driverId"), (UUID) next.get("passengerId")))
      notices.send(
          null,
          user,
          "RIDE_WAITLIST_AVAILABLE",
          "ride:" + rideId,
          id,
          "/caronas/matches?match=" + id,
          "Uma vaga foi liberada. A combinação de carona voltou para confirmação.");
    matchChanged(id);
  }

  @Transactional
  public void deleteConversation(Actor a, UUID id) {
    participant(a, id);
    close(id);
    purge(id);
  }

  private void purge(UUID id) {
    db.jdbc.update("DELETE FROM ride_message WHERE match_id=?", id);
    db.jdbc.update("DELETE FROM ride_live_location WHERE match_id=?", id);
    db.jdbc.update(
        "UPDATE ride_safety_share SET revoked_at=coalesce(revoked_at,now()) WHERE match_id=?",
        id);
    db.jdbc.update(
        "UPDATE ride_match SET meeting_point=NULL,pickup_lat=NULL,pickup_lng=NULL,boarding_code=NULL,"
            + " deleted_at=coalesce(deleted_at,now()) WHERE id=?",
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
                + " ('CANCELLED','REJECTED','NO_SHOW'))) OR m.purge_at<=now())"
                + " ORDER BY r.id LIMIT 100")) {
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
    if (body == null || body.isBlank() || body.length() > 2000)
      throw ApiException.invalid("Escreva uma mensagem válida.");
    UUID message = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride_message VALUES (?,?,?,?,now())", message, id, a.id(), body.strip());
    UUID peer =
        (UUID) (a.id().equals(m.get("driverId")) ? m.get("passengerId") : m.get("driverId"));
    notices.send(
        a.id(),
        peer,
        "RIDE_MESSAGE",
        "ride-match:" + id,
        message,
        "/caronas/matches?match=" + id,
        "Você recebeu uma nova mensagem na carona.");
    matchChanged(id);
  }

  @Transactional
  public void meeting(Actor a, UUID id, String point) {
    var m = access(a, id);
    requireOpen(m);
    if (point == null || point.isBlank() || point.length() > 500)
      throw ApiException.invalid("Informe um ponto de encontro válido.");
    db.jdbc.update(
        "UPDATE ride_match SET meeting_point=?,pickup_lat=NULL,pickup_lng=NULL WHERE id=?",
        point.strip(),
        id);
    matchChanged(id);
  }

  @Transactional
  public void finish(Actor a, UUID id, boolean cancel) {
    var r = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", id);
    if (!r.get("ownerId").equals(a.id())) throw ApiException.forbidden();
    if (!cancel && Instant.parse((String) r.get("departureAt")).isAfter(Instant.now()))
      throw ApiException.invalid("A carona ainda não começou.");

    var affected =
        db.list(
            "SELECT id,driver_id,passenger_id,request_ride_id,status FROM ride_match"
                + " WHERE ride_id=? AND deleted_at IS NULL FOR UPDATE",
            id);
    if (cancel) {
      for (var m : affected)
        if (m.get("requestRideId") != null && "ACCEPTED".equals(m.get("status")))
          db.jdbc.update(
              "UPDATE ride SET status='OPEN',trip_status='MATCHING'"
                  + " WHERE id=? AND departure_at>now() AND status='COMPLETED'",
              m.get("requestRideId"));
    }

    db.jdbc.update(
        "UPDATE ride SET status=?,trip_status=?,completed_at=CASE WHEN ? THEN completed_at ELSE now() END"
            + " WHERE id=? AND status='OPEN'",
        cancel ? "CANCELLED" : "COMPLETED",
        cancel ? "CANCELLED" : "COMPLETED",
        cancel,
        id);

    for (var m : affected) {
      close((UUID) m.get("id"));
      UUID driver = (UUID) m.get("driverId");
      UUID passenger = (UUID) m.get("passengerId");
      UUID peer = a.id().equals(driver) ? passenger : driver;
      notices.send(
          a.id(),
          peer,
          cancel ? "RIDE_CANCELLED" : "RIDE_STATUS",
          "ride:" + id,
          (UUID) m.get("id"),
          "/caronas/matches?match=" + m.get("id"),
          cancel
              ? "A carona foi cancelada."
              : "A carona foi concluída. Você já pode avaliar a experiência.");
    }
    db.jdbc.update(
        "UPDATE ride_driver_availability SET enabled=false,status='OFFLINE',offer_ride_id=NULL,"
            + " pending_match_id=NULL,updated_at=now() WHERE offer_ride_id=?",
        id);
    changed(id, true);
  }

  @Transactional
  public void review(Actor a, UUID id, int rating) {
    review(a, id, rating, null, null, null, null, null);
  }

  @Transactional
  public void review(
      Actor a,
      UUID id,
      int rating,
      Integer punctuality,
      Integer communication,
      Integer respect,
      Boolean responsible,
      String comment) {
    var m = access(a, id);
    if (!m.get("rideStatus").equals("COMPLETED"))
      throw ApiException.invalid("Avalie apenas após a conclusão da carona.");
    String note = comment == null ? null : comment.strip();
    if (note != null && note.length() > 800)
      throw ApiException.invalid("O comentário da avaliação é muito longo.");
    db.jdbc.update(
        "INSERT INTO ride_review(match_id,reviewer_id,rating,punctuality,communication,respect,responsible,comment)"
            + " VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(match_id,reviewer_id) DO UPDATE SET"
            + " rating=EXCLUDED.rating,punctuality=EXCLUDED.punctuality,"
            + " communication=EXCLUDED.communication,respect=EXCLUDED.respect,"
            + " responsible=EXCLUDED.responsible,comment=EXCLUDED.comment",
        id,
        a.id(),
        rating,
        punctuality,
        communication,
        respect,
        responsible,
        note == null || note.isBlank() ? null : note);
    matchChanged(id);
  }

  private static Double snap(Double value) {
    return value == null ? null : Math.round(value * 1000.0) / 1000.0;
  }
}
