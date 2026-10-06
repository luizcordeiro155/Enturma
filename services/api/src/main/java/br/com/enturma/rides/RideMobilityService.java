package br.com.enturma.rides;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.NotificationService;
import java.time.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RideMobilityService {
  private static final Logger log = LoggerFactory.getLogger(RideMobilityService.class);
  private static final Set<String> LIVE_STATUSES =
      Set.of("DRIVER_ON_THE_WAY", "ARRIVING", "WAITING_PASSENGER", "IN_PROGRESS");
  private static final Map<String, Set<String>> NEXT =
      Map.of(
          "SCHEDULED", Set.of("MATCHING", "DRIVER_ON_THE_WAY", "CANCELLED"),
          "MATCHING", Set.of("DRIVER_ON_THE_WAY", "CANCELLED"),
          "DRIVER_ON_THE_WAY", Set.of("ARRIVING", "CANCELLED"),
          "ARRIVING", Set.of("WAITING_PASSENGER", "IN_PROGRESS", "CANCELLED"),
          "WAITING_PASSENGER", Set.of("IN_PROGRESS", "CANCELLED"),
          "IN_PROGRESS", Set.of("ARRIVED", "CANCELLED"),
          "ARRIVED", Set.of("COMPLETED", "CANCELLED"),
          "COMPLETED", Set.of(),
          "CANCELLED", Set.of());

  private final Db db;
  private final CatalogService catalog;
  private final NotificationService notices;
  private final ApplicationEventPublisher events;

  public RideMobilityService(
      Db db,
      CatalogService catalog,
      NotificationService notices,
      ApplicationEventPublisher events) {
    this.db = db;
    this.catalog = catalog;
    this.notices = notices;
    this.events = events;
  }

  public Object vehicle(Actor actor) {
    var rows =
        db.list(
            "SELECT brand,model,color,model_year,seats,plate_hint,updated_at"
                + " FROM ride_vehicle_profile WHERE user_id=?",
            actor.id());
    return rows.isEmpty() ? Map.of() : rows.getFirst();
  }

  @Transactional
  public Object saveVehicle(
      Actor actor,
      String brand,
      String model,
      String color,
      Integer modelYear,
      int seats,
      String plateHint) {
    if (seats < 1 || seats > 8)
      throw ApiException.invalid("Informe entre 1 e 8 vagas no veículo.");
    String hint = maskPlate(plateHint);
    db.jdbc.update(
        "INSERT INTO ride_vehicle_profile(user_id,brand,model,color,model_year,seats,plate_hint)"
            + " VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET"
            + " brand=EXCLUDED.brand,model=EXCLUDED.model,color=EXCLUDED.color,"
            + " model_year=EXCLUDED.model_year,seats=EXCLUDED.seats,plate_hint=EXCLUDED.plate_hint,"
            + " updated_at=now()",
        actor.id(),
        cleanRequired(brand, 60),
        cleanRequired(model, 80),
        cleanRequired(color, 40),
        modelYear,
        seats,
        hint == null || hint.isBlank() ? null : hint);
    return vehicle(actor);
  }

  public Object reputation(UUID user) {
    var rows =
        db.list(
            "SELECT * FROM ride_reputation_summary WHERE reviewee_id=?",
            user);
    var out = new LinkedHashMap<String, Object>();
    if (!rows.isEmpty()) out.putAll(rows.getFirst());
    else {
      out.put("revieweeId", user);
      out.put("reviews", 0);
      out.put("rating", 0);
    }
    out.put(
        "completedTrips",
        db.jdbc.queryForObject(
            "SELECT count(*) FROM ride_match m JOIN ride r ON r.id=m.ride_id"
                + " WHERE (m.driver_id=? OR m.passenger_id=?) AND r.status='COMPLETED'",
            Integer.class,
            user,
            user));
    out.put(
        "noShows",
        db.jdbc.queryForObject(
            "SELECT count(*) FROM ride_match WHERE no_show_user_id=? AND status='NO_SHOW'",
            Integer.class,
            user));
    out.put(
        "verifiedStudent",
        db.exists(
            "SELECT EXISTS(SELECT 1 FROM academic_enrollment WHERE user_id=?)",
            user));
    return out;
  }

  public Object pickupZones(UUID campus) {
    catalog.verified(campus, "CAMPUS");
    return db.list(
        "SELECT id,name,description,lat,lng FROM campus_pickup_zone"
            + " WHERE campus_id=? AND active ORDER BY name,id",
        campus);
  }

  @Transactional
  public Object addPickupZone(
      Actor actor, UUID campus, String name, String description, double lat, double lng) {
    catalog.verified(campus, "CAMPUS");
    validCoordinate(lat, lng);
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO campus_pickup_zone(id,campus_id,name,description,lat,lng,created_by)"
            + " VALUES (?,?,?,?,?,?,?)",
        id,
        campus,
        cleanRequired(name, 120),
        clean(description, 300) == null ? "" : clean(description, 300),
        lat,
        lng,
        actor.id());
    return db.one(
        "SELECT id,name,description,lat,lng FROM campus_pickup_zone WHERE id=?",
        id);
  }

  @Transactional
  public void meetingZone(Actor actor, UUID matchId, UUID zoneId) {
    var match = acceptedMatch(actor, matchId, true);
    requireActive(match);
    var zone =
        db.one(
            "SELECT z.id,z.name,z.lat,z.lng FROM campus_pickup_zone z JOIN ride r ON r.campus_id=z.campus_id"
                + " WHERE z.id=? AND z.active AND r.id=?",
            zoneId,
            match.get("rideId"));
    db.jdbc.update(
        "UPDATE ride_match SET meeting_point=?,pickup_lat=?,pickup_lng=? WHERE id=?",
        zone.get("name"),
        zone.get("lat"),
        zone.get("lng"),
        matchId);
    changedMatch(match);
  }

  @Transactional
  public void tripStatus(Actor actor, UUID rideId, String next) {
    var ride = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", rideId);
    if (!canDrive(actor.id(), rideId, ride)) throw ApiException.forbidden();
    String current = String.valueOf(ride.get("tripStatus"));
    if (!NEXT.getOrDefault(current, Set.of()).contains(next))
      throw ApiException.invalid("Esta mudança de status da carona não é permitida agora.");
    if (next.equals("IN_PROGRESS")) {
      if (!db.exists(
          "SELECT EXISTS(SELECT 1 FROM ride_match WHERE ride_id=? AND status='ACCEPTED')",
          rideId))
        throw ApiException.invalid("Confirme pelo menos um passageiro antes de iniciar a viagem.");
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM ride_match WHERE ride_id=? AND status='ACCEPTED'"
              + " AND boarded_at IS NULL)",
          rideId))
        throw ApiException.invalid(
            "Confirme o embarque de todos os passageiros com o PIN antes de iniciar a viagem.");
    }

    Instant now = Instant.now();
    if (next.equals("COMPLETED")) {
      db.jdbc.update(
          "UPDATE ride SET trip_status='COMPLETED',status='COMPLETED',completed_at=? WHERE id=?",
          java.sql.Timestamp.from(now),
          rideId);
      closeRideMatches(rideId);
    } else if (next.equals("CANCELLED")) {
      reopenMatchedRequests(rideId);
      db.jdbc.update(
          "UPDATE ride SET trip_status='CANCELLED',status='CANCELLED' WHERE id=?",
          rideId);
      closeRideMatches(rideId);
    } else {
      String timestamp =
          next.equals("IN_PROGRESS")
              ? ",started_at=coalesce(started_at,now())"
              : next.equals("ARRIVED") ? ",arrived_at=coalesce(arrived_at,now())" : "";
      db.jdbc.update(
          "UPDATE ride SET trip_status=?" + timestamp + " WHERE id=?",
          next,
          rideId);
    }

    String message =
        switch (next) {
          case "DRIVER_ON_THE_WAY" -> "O motorista iniciou o trajeto para o ponto de encontro.";
          case "ARRIVING" -> "O motorista está chegando ao ponto combinado.";
          case "WAITING_PASSENGER" -> "O motorista chegou e está aguardando o embarque.";
          case "IN_PROGRESS" -> "A carona começou. Boa viagem!";
          case "ARRIVED" -> "A carona chegou ao destino.";
          case "COMPLETED" -> "A carona foi concluída. Você já pode avaliar a experiência.";
          case "CANCELLED" -> "A carona foi cancelada.";
          default -> "O status da sua carona foi atualizado.";
        };
    if (Set.of("COMPLETED", "CANCELLED").contains(next))
      db.jdbc.update(
          "UPDATE ride_driver_availability SET enabled=false,status='OFFLINE',offer_ride_id=NULL,"
              + " pending_match_id=NULL,updated_at=now() WHERE offer_ride_id=?",
          rideId);
    log.info(
        "ride_status ride={} actor={} from={} to={}",
        rideId,
        actor.id(),
        current,
        next);
    notifyRide(actor.id(), rideId, "RIDE_STATUS", message);
    changedRide(rideId, true);
  }

  @Transactional
  public Object confirm(Actor actor, UUID matchId) {
    var match = acceptedMatch(actor, matchId, true);
    requireActive(match);
    if (actor.id().equals(match.get("driverId")))
      db.jdbc.update("UPDATE ride_match SET driver_confirmed=true WHERE id=?", matchId);
    else if (actor.id().equals(match.get("passengerId")))
      db.jdbc.update("UPDATE ride_match SET passenger_confirmed=true WHERE id=?", matchId);
    else throw ApiException.forbidden();
    match = db.one("SELECT * FROM ride_match WHERE id=?", matchId);
    changedMatch(match);
    return Map.of(
        "driverConfirmed", Boolean.TRUE.equals(match.get("driverConfirmed")),
        "passengerConfirmed", Boolean.TRUE.equals(match.get("passengerConfirmed")));
  }

  @Transactional
  public Object boardingCode(Actor actor, UUID matchId) {
    var match = acceptedMatch(actor, matchId, true);
    requireActive(match);
    if (!actor.id().equals(match.get("passengerId"))) throw ApiException.forbidden();
    String code = match.get("boardingCode") == null ? boardingCode() : String.valueOf(match.get("boardingCode"));
    if (match.get("boardingCode") == null)
      db.jdbc.update("UPDATE ride_match SET boarding_code=? WHERE id=?", code, matchId);
    return Map.of("code", code);
  }

  @Transactional
  public void board(Actor actor, UUID matchId, String code) {
    var match = acceptedMatch(actor, matchId, true);
    requireActive(match);
    if (!actor.id().equals(match.get("driverId"))) throw ApiException.forbidden();
    if (!"WAITING_PASSENGER".equals(match.get("tripStatus")))
      throw ApiException.invalid("Confirme o embarque somente depois de chegar ao ponto de encontro.");
    String expected = match.get("boardingCode") == null ? "" : String.valueOf(match.get("boardingCode"));
    if (!expected.equals(code))
      throw new ApiException(409, "BOARDING_CODE_INVALID", "O código de embarque está incorreto.");
    db.jdbc.update(
        "UPDATE ride_match SET boarded_at=coalesce(boarded_at,now()),driver_confirmed=true,"
            + " passenger_confirmed=true WHERE id=?",
        matchId);
    db.jdbc.update(
        "INSERT INTO ride_safety_event(id,match_id,actor_id,kind) VALUES (?,?,?,'BOARDING_CONFIRMED')",
        UUID.randomUUID(),
        matchId,
        actor.id());
    log.info("ride_boarded match={} driver={}", matchId, actor.id());

    UUID rideId = (UUID) match.get("rideId");
    boolean allBoarded =
        !db.exists(
            "SELECT EXISTS(SELECT 1 FROM ride_match WHERE ride_id=? AND status='ACCEPTED'"
                + " AND boarded_at IS NULL AND deleted_at IS NULL)",
            rideId);
    if (allBoarded) {
      int started =
          db.jdbc.update(
              "UPDATE ride SET trip_status='IN_PROGRESS',started_at=coalesce(started_at,now())"
                  + " WHERE id=? AND status='OPEN' AND trip_status IN ('WAITING_PASSENGER','ARRIVING')",
              rideId);
      if (started > 0) {
        log.info("ride_auto_started ride={} by_boarding_match={}", rideId, matchId);
        notifyRide(
            actor.id(),
            rideId,
            "RIDE_STATUS",
            "Código confirmado. A carona começou automaticamente. Boa viagem!");
        changedRide(rideId, true);
      } else {
        changedMatch(db.one("SELECT * FROM ride_match WHERE id=?", matchId));
      }
    } else {
      changedMatch(db.one("SELECT * FROM ride_match WHERE id=?", matchId));
    }
  }

  @Transactional
  public void liveLocation(
      Actor actor, UUID matchId, double lat, double lng, int accuracyMeters) {
    liveLocation(actor, matchId, lat, lng, accuracyMeters, null, null, null);
  }

  @Transactional
  public void liveLocation(
      Actor actor,
      UUID matchId,
      double lat,
      double lng,
      int accuracyMeters,
      Double speedMps,
      Double heading,
      Instant capturedAt) {
    validCoordinate(lat, lng);
    if (accuracyMeters < 0 || accuracyMeters > 50000)
      throw ApiException.invalid("A precisão da localização é inválida.");
    if (accuracyMeters > 1500)
      throw ApiException.invalid("A precisão atual do GPS é insuficiente para a carona.");
    if (speedMps != null && (speedMps < 0 || speedMps > 100))
      throw ApiException.invalid("A velocidade informada pelo GPS é inválida.");
    if (heading != null && (heading < 0 || heading > 360))
      throw ApiException.invalid("A direção informada pelo GPS é inválida.");
    Instant captured = capturedAt == null ? Instant.now() : capturedAt;
    if (captured.isBefore(Instant.now().minus(Duration.ofMinutes(2)))
        || captured.isAfter(Instant.now().plusSeconds(30)))
      throw ApiException.invalid("A posição recebida está desatualizada.");
    var match = acceptedMatch(actor, matchId, true);
    requireActive(match);
    String trip = String.valueOf(match.get("tripStatus"));
    if (!LIVE_STATUSES.contains(trip))
      throw ApiException.invalid(
          "A localização em tempo real só fica disponível durante o deslocamento.");
    db.jdbc.update(
        "INSERT INTO ride_live_location(match_id,user_id,lat,lng,accuracy_m,heading,speed_mps,captured_at)"
            + " VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(match_id,user_id) DO UPDATE SET"
            + " lat=EXCLUDED.lat,lng=EXCLUDED.lng,accuracy_m=EXCLUDED.accuracy_m,"
            + " heading=EXCLUDED.heading,speed_mps=EXCLUDED.speed_mps,"
            + " captured_at=EXCLUDED.captured_at,updated_at=now()",
        matchId,
        actor.id(),
        lat,
        lng,
        accuracyMeters,
        heading,
        speedMps,
        java.sql.Timestamp.from(captured));
    changedMatch(match);
  }

  public Object peerLocation(Actor actor, UUID matchId) {
    var match = acceptedMatch(actor, matchId, false);
    if (!LIVE_STATUSES.contains(String.valueOf(match.get("tripStatus"))))
      return Map.of("available", false);
    UUID peer =
        actor.id().equals(match.get("driverId"))
            ? (UUID) match.get("passengerId")
            : (UUID) match.get("driverId");
    var rows =
        db.list(
            "SELECT lat,lng,accuracy_m,heading,speed_mps,captured_at,updated_at FROM ride_live_location"
                + " WHERE match_id=? AND user_id=? AND updated_at>now()-interval '2 minutes'",
            matchId,
            peer);
    if (rows.isEmpty()) return Map.of("available", false);
    var out = new LinkedHashMap<String, Object>(rows.getFirst());
    out.put("available", true);
    var mine =
        db.list(
            "SELECT lat,lng FROM ride_live_location WHERE match_id=? AND user_id=?"
                + " AND updated_at>now()-interval '2 minutes'",
            matchId,
            actor.id());
    if (!mine.isEmpty()) {
      double km =
          RideMatchingService.haversine(
              number(mine.getFirst().get("lat")),
              number(mine.getFirst().get("lng")),
              number(out.get("lat")),
              number(out.get("lng")));
      out.put("distanceKm", Math.round(km * 10.0) / 10.0);
      out.put("etaMinutes", Math.max(1, (int) Math.ceil(km / 25.0 * 60.0)));
    }
    return out;
  }

  @Transactional
  public void stopLiveLocation(Actor actor, UUID matchId) {
    acceptedMatch(actor, matchId, false);
    db.jdbc.update(
        "DELETE FROM ride_live_location WHERE match_id=? AND user_id=?",
        matchId,
        actor.id());
    events.publishEvent(new RideChanged(Set.of(actor.id()), false));
  }

  @Transactional
  public Object createSafetyShare(Actor actor, UUID matchId) {
    var match = acceptedMatch(actor, matchId, false);
    requireActive(match);
    UUID token = UUID.randomUUID();
    UUID id = UUID.randomUUID();
    Instant expiry =
        Instant.parse(String.valueOf(match.get("departureAt")))
            .plus(Duration.ofHours(24));
    Instant max = Instant.now().plus(Duration.ofHours(12));
    if (expiry.isAfter(max)) expiry = max;
    if (expiry.isBefore(Instant.now().plus(Duration.ofMinutes(30))))
      expiry = Instant.now().plus(Duration.ofMinutes(30));
    db.jdbc.update(
        "INSERT INTO ride_safety_share(id,token,match_id,shared_by,expires_at)"
            + " VALUES (?,?,?,?,?)",
        id,
        token,
        matchId,
        actor.id(),
        java.sql.Timestamp.from(expiry));
    db.jdbc.update(
        "INSERT INTO ride_safety_event(id,match_id,actor_id,kind) VALUES (?,?,?,'SHARED')",
        UUID.randomUUID(),
        matchId,
        actor.id());
    return Map.of(
        "id", id,
        "token", token,
        "path", "/caronas/seguranca/" + token,
        "expiresAt", expiry.toString());
  }

  @Transactional
  public void revokeSafetyShare(Actor actor, UUID id) {
    int updated =
        db.jdbc.update(
            "UPDATE ride_safety_share SET revoked_at=coalesce(revoked_at,now())"
                + " WHERE id=? AND shared_by=?",
            id,
            actor.id());
    if (updated == 0) throw ApiException.missing();
  }

  public Object publicSafety(UUID token) {
    var share =
        db.one(
            "SELECT s.shared_by,s.expires_at,m.id match_id,m.meeting_point,m.driver_id,m.passenger_id,"
                + " r.trip_status,r.origin_area,r.departure_at,c.name campus_name,"
                + " d.name driver_name,p.name passenger_name"
                + " FROM ride_safety_share s JOIN ride_match m ON m.id=s.match_id"
                + " JOIN ride r ON r.id=m.ride_id JOIN academic_entry c ON c.id=r.campus_id"
                + " JOIN app_user d ON d.id=m.driver_id JOIN app_user p ON p.id=m.passenger_id"
                + " WHERE s.token=? AND s.revoked_at IS NULL AND s.expires_at>now()",
            token);
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE"
            + " (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?))",
        share.get("driverId"),
        share.get("passengerId"),
        share.get("passengerId"),
        share.get("driverId")))
      throw ApiException.missing();
    var out = new LinkedHashMap<String, Object>();
    out.put("tripStatus", share.get("tripStatus"));
    out.put("originArea", share.get("originArea"));
    out.put("departureAt", share.get("departureAt"));
    out.put("campusName", share.get("campusName"));
    out.put("driverName", share.get("driverName"));
    out.put("passengerName", share.get("passengerName"));
    String publicTripStatus = String.valueOf(share.get("tripStatus"));
    boolean activeTrip =
        !Set.of("COMPLETED", "CANCELLED").contains(publicTripStatus);
    out.put("meetingPoint", activeTrip ? share.get("meetingPoint") : null);
    out.put("expiresAt", share.get("expiresAt"));
    var location =
        activeTrip
            ? db.list(
            "SELECT lat,lng,accuracy_m,updated_at FROM ride_live_location"
                + " WHERE match_id=? AND user_id=? AND updated_at>now()-interval '2 minutes'",
            share.get("matchId"),
            share.get("sharedBy"))
            : List.<Map<String, Object>>of();
    out.put("location", location.isEmpty() ? null : location.getFirst());
    return out;
  }

  @Transactional
  public void noShow(Actor actor, UUID matchId) {
    var match = acceptedMatch(actor, matchId, true);
    requireActive(match);
    if (Set.of("IN_PROGRESS", "ARRIVED", "COMPLETED")
        .contains(String.valueOf(match.get("tripStatus"))))
      throw ApiException.invalid("Não é possível registrar no-show depois do início da viagem.");
    Instant departure = Instant.parse(String.valueOf(match.get("departureAt")));
    if (Instant.now().isBefore(departure.plus(Duration.ofMinutes(10))))
      throw ApiException.invalid("O no-show só pode ser registrado 10 minutos após o horário.");

    UUID peer =
        actor.id().equals(match.get("driverId"))
            ? (UUID) match.get("passengerId")
            : (UUID) match.get("driverId");
    db.jdbc.update(
        "UPDATE ride_match SET status='NO_SHOW',no_show_user_id=?,"
            + " closed_at=coalesce(closed_at,now()),"
            + " purge_at=coalesce(purge_at,now()+interval '24 hours') WHERE id=?",
        peer,
        matchId);
    db.jdbc.update("DELETE FROM ride_live_location WHERE match_id=?", matchId);
    db.jdbc.update(
        "UPDATE ride_safety_share SET revoked_at=coalesce(revoked_at,now())"
            + " WHERE match_id=? AND revoked_at IS NULL",
        matchId);
    db.jdbc.update(
        "UPDATE ride_voice SET cleaned=false,updated_at=now() WHERE match_id=?",
        matchId);
    db.jdbc.update(
        "INSERT INTO ride_safety_event(id,match_id,actor_id,kind) VALUES (?,?,?,'NO_SHOW')",
        UUID.randomUUID(),
        matchId,
        actor.id());
    notices.send(
        actor.id(),
        peer,
        "RIDE_NO_SHOW",
        "ride-match:" + matchId,
        matchId,
        "/caronas/matches?match=" + matchId,
        "Foi registrado um não comparecimento nesta carona.");
    changedRide((UUID) match.get("rideId"), true);
  }

  public Object recurrences(Actor actor) {
    return db.list(
        "SELECT rr.*,c.name campus_name FROM ride_recurrence rr"
            + " JOIN academic_entry c ON c.id=rr.campus_id WHERE rr.owner_id=?"
            + " ORDER BY rr.active DESC,rr.created_at DESC",
        actor.id());
  }

  @Transactional
  public Object createRecurrence(
      Actor actor,
      UUID campus,
      String type,
      String area,
      String direction,
      LocalTime localTime,
      String timezone,
      List<Integer> weekdays,
      int seats,
      Double lat,
      Double lng,
      Integer accuracy) {
    catalog.verified(campus, "CAMPUS");
    if (!Set.of("OFFER", "REQUEST").contains(type)
        || !Set.of("TO_CAMPUS", "FROM_CAMPUS").contains(direction)
        || weekdays == null
        || weekdays.isEmpty()
        || weekdays.stream().anyMatch(d -> d < 1 || d > 7)
        || seats < 1
        || seats > 8)
      throw ApiException.invalid("Confira a rotina da carona.");
    try {
      ZoneId.of(timezone);
    } catch (DateTimeException invalidTimezone) {
      throw ApiException.invalid("Fuso horário inválido para a rotina.");
    }
    if (accuracy != null && (accuracy < 0 || accuracy > 50000))
      throw ApiException.invalid("A precisão da localização é inválida.");
    if (lat != null || lng != null) {
      if (lat == null || lng == null) throw ApiException.invalid("Localização incompleta.");
      validCoordinate(lat, lng);
    }
    UUID id = UUID.randomUUID();
    String days =
        weekdays.stream().distinct().sorted().map(String::valueOf).reduce((a, b) -> a + "," + b).orElseThrow();
    db.jdbc.update(
        "INSERT INTO ride_recurrence(id,owner_id,campus_id,type,origin_area,direction,local_time,"
            + " timezone,weekdays,seats,area_lat,area_lng,area_accuracy_m)"
            + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        id,
        actor.id(),
        campus,
        type,
        cleanRequired(area, 120),
        direction,
        java.sql.Time.valueOf(localTime),
        timezone,
        days,
        seats,
        snap(lat),
        snap(lng),
        accuracy);
    materialize(id);
    return Map.of("id", id);
  }

  @Transactional
  public void deleteRecurrence(Actor actor, UUID id) {
    int updated =
        db.jdbc.update(
            "UPDATE ride_recurrence SET active=false WHERE id=? AND owner_id=?",
            id,
            actor.id());
    if (updated == 0) throw ApiException.missing();
  }

  @Scheduled(fixedDelay = 3600000, initialDelay = 30000)
  @Transactional
  public void materializeRecurrences() {
    for (var row :
        db.list(
            "SELECT id FROM ride_recurrence WHERE active ORDER BY id FOR UPDATE SKIP LOCKED"))
      materialize((UUID) row.get("id"));
  }

  private void materialize(UUID recurrenceId) {
    var r = db.one("SELECT * FROM ride_recurrence WHERE id=?", recurrenceId);
    if (!Boolean.TRUE.equals(r.get("active"))) return;
    ZoneId zone = ZoneId.of(String.valueOf(r.get("timezone")));
    LocalTime time = LocalTime.parse(String.valueOf(r.get("localTime")));
    Set<Integer> days = new HashSet<>();
    for (String day : String.valueOf(r.get("weekdays")).split(",")) days.add(Integer.parseInt(day));
    LocalDate today = LocalDate.now(zone);
    for (int offset = 0; offset < 14; offset++) {
      LocalDate date = today.plusDays(offset);
      if (!days.contains(date.getDayOfWeek().getValue())) continue;
      Instant departure = ZonedDateTime.of(date, time, zone).toInstant();
      if (departure.isBefore(Instant.now().plus(Duration.ofMinutes(15)))) continue;
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM ride_recurrence_instance WHERE recurrence_id=? AND service_date=?)",
          recurrenceId,
          java.sql.Date.valueOf(date))) continue;
      UUID ride = UUID.randomUUID();
      db.jdbc.update(
          "INSERT INTO ride(id,owner_id,campus_id,type,origin_area,direction,departure_at,seats,"
              + " area_lat,area_lng,area_accuracy_m,recurrence_id,trip_status)"
              + " VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'SCHEDULED')",
          ride,
          r.get("ownerId"),
          r.get("campusId"),
          r.get("type"),
          r.get("originArea"),
          r.get("direction"),
          java.sql.Timestamp.from(departure),
          r.get("seats"),
          r.get("areaLat"),
          r.get("areaLng"),
          r.get("areaAccuracyM"),
          recurrenceId);
      db.jdbc.update(
          "INSERT INTO ride_recurrence_instance(recurrence_id,service_date,ride_id) VALUES (?,?,?)",
          recurrenceId,
          java.sql.Date.valueOf(date),
          ride);
      changedRide(ride, true);
    }
  }

  @Transactional
  public void reorderPickups(Actor actor, UUID rideId, List<UUID> matchIds) {
    var ride = db.one("SELECT * FROM ride WHERE id=? FOR UPDATE", rideId);
    if (!canDrive(actor.id(), rideId, ride)) throw ApiException.forbidden();
    if (!"OPEN".equals(ride.get("status")))
      throw ApiException.invalid("Esta carona já foi encerrada.");
    if (matchIds == null || matchIds.size() > 8)
      throw ApiException.invalid("A ordem das paradas é inválida.");
    int order = 1;
    Set<UUID> seen = new HashSet<>();
    for (UUID match : matchIds) {
      if (!seen.add(match)) throw ApiException.invalid("Parada repetida.");
      int updated =
          db.jdbc.update(
              "UPDATE ride_match SET pickup_order=? WHERE id=? AND ride_id=? AND status='ACCEPTED'",
              order++,
              match,
              rideId);
      if (updated == 0) throw ApiException.invalid("Uma das paradas não pertence à carona.");
    }
    changedRide(rideId, false);
  }

  @Scheduled(fixedDelay = 300000, initialDelay = 45000)
  public void upcomingRideReminders() {
    for (var row :
        db.list(
            "SELECT id FROM ride WHERE status='OPEN' AND departure_at"
                + " BETWEEN now()+interval '25 minutes' AND now()+interval '35 minutes'"
                + " ORDER BY departure_at,id LIMIT 200"))
      notifyRide(
          null,
          (UUID) row.get("id"),
          "RIDE_REMINDER_30",
          "Sua carona sai em aproximadamente 30 minutos.");
  }

  @Scheduled(fixedDelay = 300000, initialDelay = 60000)
  public void cleanupLocationsAndShares() {
    db.jdbc.update("DELETE FROM ride_live_location WHERE updated_at<now()-interval '15 minutes'");
    db.jdbc.update(
        "UPDATE ride_safety_share SET revoked_at=now() WHERE revoked_at IS NULL AND expires_at<=now()");
  }

  private Map<String, Object> acceptedMatch(Actor actor, UUID id, boolean lock) {
    String suffix = lock ? " FOR UPDATE OF m" : "";
    var m =
        db.one(
            "SELECT m.*,r.owner_id,r.campus_id,r.origin_area,r.departure_at,r.status ride_status,"
                + " r.trip_status,r.type FROM ride_match m JOIN ride r ON r.id=m.ride_id"
                + " WHERE m.id=?" + suffix,
            id);
    if (!actor.id().equals(m.get("driverId")) && !actor.id().equals(m.get("passengerId")))
      throw ApiException.forbidden();
    if (!"ACCEPTED".equals(m.get("status")) || m.get("deletedAt") != null)
      throw ApiException.forbidden();
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE"
            + " (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?))",
        m.get("driverId"),
        m.get("passengerId"),
        m.get("passengerId"),
        m.get("driverId")))
      throw ApiException.forbidden();
    return m;
  }

  private void requireActive(Map<String, Object> match) {
    if (match.get("closedAt") != null || !"OPEN".equals(match.get("rideStatus")))
      throw ApiException.invalid("Esta carona já foi encerrada.");
  }

  private boolean canDrive(UUID actor, UUID rideId, Map<String, Object> ride) {
    if ("OFFER".equals(ride.get("type")) && actor.equals(ride.get("ownerId"))) return true;
    return db.exists(
        "SELECT EXISTS(SELECT 1 FROM ride_match WHERE ride_id=? AND driver_id=? AND status='ACCEPTED')",
        rideId,
        actor);
  }

  private void reopenMatchedRequests(UUID ride) {
    for (var match :
        db.list(
            "SELECT request_ride_id FROM ride_match WHERE ride_id=?"
                + " AND request_ride_id IS NOT NULL AND status='ACCEPTED'",
            ride))
      db.jdbc.update(
          "UPDATE ride SET status='OPEN',trip_status='MATCHING'"
              + " WHERE id=? AND departure_at>now() AND status='COMPLETED'",
          match.get("requestRideId"));
  }

  private void closeRideMatches(UUID ride) {
    db.jdbc.update(
        "UPDATE ride_match SET closed_at=coalesce(closed_at,now()),"
            + " purge_at=coalesce(purge_at,now()+interval '24 hours')"
            + " WHERE ride_id=? AND deleted_at IS NULL",
        ride);
    db.jdbc.update(
        "UPDATE ride_voice SET cleaned=false,updated_at=now()"
            + " WHERE match_id IN (SELECT id FROM ride_match WHERE ride_id=?)",
        ride);
    db.jdbc.update(
        "DELETE FROM ride_live_location WHERE match_id IN"
            + " (SELECT id FROM ride_match WHERE ride_id=?)",
        ride);
  }

  private void notifyRide(UUID actor, UUID ride, String kind, String message) {
    for (var row :
        db.list(
            "SELECT DISTINCT x.user_id FROM ("
                + " SELECT owner_id user_id FROM ride WHERE id=?"
                + " UNION SELECT driver_id FROM ride_match WHERE ride_id=? AND status='ACCEPTED'"
                + " UNION SELECT passenger_id FROM ride_match WHERE ride_id=? AND status='ACCEPTED'"
                + " ) x",
            ride,
            ride,
            ride)) {
      UUID user = (UUID) row.get("userId");
      notices.send(actor, user, kind, "ride:" + ride, ride, "/caronas/matches", message);
    }
  }

  private void changedMatch(Map<String, Object> match) {
    events.publishEvent(
        new RideChanged(
            Set.of((UUID) match.get("driverId"), (UUID) match.get("passengerId")),
            false));
  }

  private void changedRide(UUID ride, boolean publicListing) {
    Set<UUID> users = new HashSet<>();
    users.add((UUID) db.one("SELECT owner_id FROM ride WHERE id=?", ride).get("ownerId"));
    for (var m : db.list("SELECT driver_id,passenger_id FROM ride_match WHERE ride_id=?", ride)) {
      users.add((UUID) m.get("driverId"));
      users.add((UUID) m.get("passengerId"));
    }
    events.publishEvent(new RideChanged(Set.copyOf(users), publicListing));
  }

  private static String boardingCode() {
    return String.format(Locale.ROOT, "%04d", java.util.concurrent.ThreadLocalRandom.current().nextInt(10000));
  }

  private static String maskPlate(String value) {
    if (value == null || value.isBlank()) return null;
    String normalized = value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    if (normalized.isBlank()) return null;
    String suffix =
        normalized.substring(Math.max(0, normalized.length() - Math.min(4, normalized.length())));
    return "•••" + suffix;
  }

  private static String cleanRequired(String value, int max) {
    String cleaned = clean(value, max);
    if (cleaned == null || cleaned.isBlank()) throw ApiException.invalid("Preencha todos os campos obrigatórios.");
    return cleaned;
  }

  private static String clean(String value, int max) {
    if (value == null) return null;
    String cleaned = value.strip();
    return cleaned.length() > max ? cleaned.substring(0, max) : cleaned;
  }

  private static void validCoordinate(double lat, double lng) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
      throw ApiException.invalid("A localização informada é inválida.");
  }

  private static Double snap(Double value) {
    return value == null ? null : Math.round(value * 1000.0) / 1000.0;
  }

  private static double number(Object value) {
    return ((Number) value).doubleValue();
  }
}
