package br.com.enturma.rides;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.NotificationService;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RideDispatchService {
  private static final Logger log = LoggerFactory.getLogger(RideDispatchService.class);
  private static final Set<String> DIRECTIONS = Set.of("TO_CAMPUS", "FROM_CAMPUS");
  private final Db db;
  private final RideMapService maps;
  private final NotificationService notices;
  private final ApplicationEventPublisher events;

  public RideDispatchService(
      Db db,
      RideMapService maps,
      NotificationService notices,
      ApplicationEventPublisher events) {
    this.db = db;
    this.maps = maps;
    this.notices = notices;
    this.events = events;
  }

  public Object state(Actor actor) {
    var out = new LinkedHashMap<String, Object>();
    out.put("preference", preference(actor));
    out.put("driverAvailability", availability(actor.id()));
    out.put("activeRequest", activeRequest(actor.id()));
    out.put("activeMatch", activeMatch(actor.id()));
    out.put("recentCompleted", recentCompleted(actor.id()));
    out.put("vehicle", vehicle(actor.id()));
    return out;
  }

  public Object preference(Actor actor) {
    var saved =
        db.list(
            "SELECT p.campus_id,p.home_label,p.home_lat,p.home_lng,p.onboarding_done,"
                + " e.name campus_name,"
                + " COALESCE(p.campus_label_override,c.address_label) campus_address,"
                + " COALESCE(p.campus_lat_override,c.latitude) campus_lat,"
                + " COALESCE(p.campus_lng_override,c.longitude) campus_lng"
                + " FROM ride_user_mobility_pref p"
                + " LEFT JOIN academic_entry e ON e.id=p.campus_id"
                + " LEFT JOIN academic_campus c ON c.id=p.campus_id WHERE p.user_id=?",
            actor.id());
    if (!saved.isEmpty()) return saved.getFirst();

    var enrollment =
        db.list(
            "SELECT o.campus_id,e.name campus_name,c.address_label campus_address,"
                + " c.latitude campus_lat,c.longitude campus_lng"
                + " FROM academic_enrollment x"
                + " JOIN academic_course_offering o ON o.id=x.course_offering_id"
                + " JOIN academic_entry e ON e.id=o.campus_id"
                + " LEFT JOIN academic_campus c ON c.id=o.campus_id WHERE x.user_id=?",
            actor.id());
    var out = new LinkedHashMap<String, Object>();
    if (!enrollment.isEmpty()) out.putAll(enrollment.getFirst());
    out.put("onboardingDone", false);
    out.put("homeLabel", null);
    out.put("homeLat", null);
    out.put("homeLng", null);
    return out;
  }

  @Transactional
  public Object savePreference(
      Actor actor,
      UUID campusId,
      String campusLabel,
      Double campusLat,
      Double campusLng,
      String homeLabel,
      Double homeLat,
      Double homeLng,
      boolean onboardingDone) {
    campus(campusId);
    if ((campusLat == null) != (campusLng == null))
      throw ApiException.invalid("A localização do campus está incompleta.");
    if (campusLat != null) coordinate(campusLat, campusLng);
    if ((homeLat == null) != (homeLng == null))
      throw ApiException.invalid("A localização de casa está incompleta.");
    if (homeLat != null) coordinate(homeLat, homeLng);
    String savedCampusLabel = clean(campusLabel, 240);
    String label = clean(homeLabel, 240);
    db.jdbc.update(
        "INSERT INTO ride_user_mobility_pref"
            + "(user_id,campus_id,campus_label_override,campus_lat_override,campus_lng_override,"
            + " home_label,home_lat,home_lng,onboarding_done,updated_at)"
            + " VALUES (?,?,?,?,?,?,?,?,?,now()) ON CONFLICT(user_id) DO UPDATE SET"
            + " campus_id=EXCLUDED.campus_id,"
            + " campus_label_override=CASE WHEN ride_user_mobility_pref.campus_id=EXCLUDED.campus_id"
            + " THEN COALESCE(EXCLUDED.campus_label_override,ride_user_mobility_pref.campus_label_override)"
            + " ELSE EXCLUDED.campus_label_override END,"
            + " campus_lat_override=CASE WHEN ride_user_mobility_pref.campus_id=EXCLUDED.campus_id"
            + " THEN COALESCE(EXCLUDED.campus_lat_override,ride_user_mobility_pref.campus_lat_override)"
            + " ELSE EXCLUDED.campus_lat_override END,"
            + " campus_lng_override=CASE WHEN ride_user_mobility_pref.campus_id=EXCLUDED.campus_id"
            + " THEN COALESCE(EXCLUDED.campus_lng_override,ride_user_mobility_pref.campus_lng_override)"
            + " ELSE EXCLUDED.campus_lng_override END,"
            + " home_label=EXCLUDED.home_label,home_lat=EXCLUDED.home_lat,home_lng=EXCLUDED.home_lng,"
            + " onboarding_done=EXCLUDED.onboarding_done,updated_at=now()",
        actor.id(),
        campusId,
        savedCampusLabel,
        campusLat,
        campusLng,
        label,
        homeLat,
        homeLng,
        onboardingDone);
    return preference(actor);
  }

  @Transactional
  public Object startPassengerSearch(
      Actor actor,
      UUID campusId,
      String direction,
      String startLabel,
      double startLat,
      double startLng,
      String endLabel,
      double endLat,
      double endLng,
      int routeDistanceMeters,
      int routeDurationSeconds) {
    if (!DIRECTIONS.contains(direction)) throw ApiException.invalid("Escolha a direção da carona.");
    coordinate(startLat, startLng);
    coordinate(endLat, endLng);
    var campus =
        campusForActorOrEndpoint(
            actor, campusId, direction, startLabel, startLat, startLng, endLabel, endLat, endLng);
    ensureCampusEndpoint(direction, campus, startLat, startLng, endLat, endLng);

    var existing =
        db.list(
            "SELECT id FROM ride WHERE owner_id=? AND type='REQUEST' AND status='OPEN'"
                + " AND dispatch_mode='ON_DEMAND' FOR UPDATE",
            actor.id());
    if (!existing.isEmpty())
      return db.one("SELECT id,status,trip_status FROM ride WHERE id=?", existing.getFirst().get("id"));

    UUID id = UUID.randomUUID();
    Instant now = Instant.now();
    String area = direction.equals("TO_CAMPUS") ? startLabel : endLabel;
    db.jdbc.update(
        "INSERT INTO ride(id,owner_id,campus_id,type,origin_area,direction,departure_at,seats,status,"
            + " area_lat,area_lng,area_accuracy_m,trip_status,dispatch_mode,start_label,start_lat,start_lng,"
            + " end_label,end_lat,end_lng,route_distance_m,route_duration_s,search_started_at)"
            + " VALUES (?,?,?,?,?,?,?,1,'OPEN',?,?,50,'MATCHING','ON_DEMAND',?,?,?,?,?,?,?,?,now())",
        id,
        actor.id(),
        campusId,
        "REQUEST",
        cleanRequired(area, 120),
        direction,
        java.sql.Timestamp.from(now.plus(Duration.ofHours(2))),
        snap(direction.equals("TO_CAMPUS") ? startLat : endLat),
        snap(direction.equals("TO_CAMPUS") ? startLng : endLng),
        cleanRequired(startLabel, 240),
        startLat,
        startLng,
        cleanRequired(endLabel, 240),
        endLat,
        endLng,
        Math.max(0, routeDistanceMeters),
        Math.max(0, routeDurationSeconds));
    changed(id, true);
    offerRequestToDrivers(id);
    log.info("ride_created mode=on_demand role=passenger ride={} campus={} direction={}", id, campusId, direction);
    return Map.of("id", id, "status", "OPEN", "tripStatus", "MATCHING");
  }

  @Transactional
  public void cancelPassengerSearch(Actor actor, String reason, String note) {
    var rows =
        db.list(
            "SELECT id FROM ride WHERE owner_id=? AND type='REQUEST' AND status='OPEN'"
                + " AND dispatch_mode='ON_DEMAND' ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
            actor.id());
    if (rows.isEmpty()) return;
    UUID ride = (UUID) rows.getFirst().get("id");
    db.jdbc.update(
        "UPDATE ride SET status='CANCELLED',trip_status='CANCELLED' WHERE id=? AND status='OPEN'",
        ride);
    cancellation(ride, null, actor.id(), reason, note);
    db.jdbc.update(
        "UPDATE ride_dispatch_attempt SET outcome='CANCELLED',updated_at=now()"
            + " WHERE request_ride_id=? AND outcome='OFFERED'",
        ride);
    changed(ride, true);
    log.info("ride_cancelled mode=on_demand role=passenger ride={}", ride);
  }

  @Transactional
  public Object setDriverAvailability(
      Actor actor,
      UUID campusId,
      String direction,
      int seats,
      String startLabel,
      double startLat,
      double startLng,
      String endLabel,
      double endLat,
      double endLng,
      double lat,
      double lng,
      int accuracyMeters) {
    if (!DIRECTIONS.contains(direction) || seats < 1 || seats > 8)
      throw ApiException.invalid("Confira a direção e a quantidade de vagas.");
    coordinate(startLat, startLng);
    coordinate(endLat, endLng);
    coordinate(lat, lng);
    if (accuracyMeters < 0 || accuracyMeters > 50000)
      throw ApiException.invalid("A precisão da localização é inválida.");
    var campus =
        campusForActorOrEndpoint(
            actor, campusId, direction, startLabel, startLat, startLng, endLabel, endLat, endLng);
    ensureCampusEndpoint(direction, campus, startLat, startLng, endLat, endLng);
    if (activeAcceptedMatch(actor.id()) != null)
      throw ApiException.invalid("Conclua ou cancele a carona ativa antes de ficar disponível.");

    db.jdbc.update(
        "INSERT INTO ride_driver_availability"
            + "(user_id,campus_id,direction,seats,enabled,status,start_label,start_lat,start_lng,"
            + " end_label,end_lat,end_lng,lat,lng,accuracy_m,online_at,updated_at)"
            + " VALUES (?,?,?,?,true,'ONLINE',?,?,?,?,?,?,?,?,?,now(),now())"
            + " ON CONFLICT(user_id) DO UPDATE SET campus_id=EXCLUDED.campus_id,"
            + " direction=EXCLUDED.direction,seats=EXCLUDED.seats,enabled=true,status='ONLINE',"
            + " start_label=EXCLUDED.start_label,start_lat=EXCLUDED.start_lat,start_lng=EXCLUDED.start_lng,"
            + " end_label=EXCLUDED.end_label,end_lat=EXCLUDED.end_lat,end_lng=EXCLUDED.end_lng,"
            + " lat=EXCLUDED.lat,lng=EXCLUDED.lng,accuracy_m=EXCLUDED.accuracy_m,"
            + " offer_ride_id=NULL,pending_match_id=NULL,online_at=now(),updated_at=now()",
        actor.id(),
        campusId,
        direction,
        seats,
        cleanRequired(startLabel, 240),
        startLat,
        startLng,
        cleanRequired(endLabel, 240),
        endLat,
        endLng,
        lat,
        lng,
        accuracyMeters);
    notifyPublic();
    log.info("driver_available user={} campus={} direction={} seats={}", actor.id(), campusId, direction, seats);
    return availability(actor.id());
  }

  @Transactional
  public void updateDriverLocation(
      Actor actor, double lat, double lng, int accuracyMeters, Double speedMps, Double heading) {
    coordinate(lat, lng);
    if (accuracyMeters < 0 || accuracyMeters > 50000)
      throw ApiException.invalid("A precisão da localização é inválida.");
    if (speedMps != null && (speedMps < 0 || speedMps > 100))
      throw ApiException.invalid("A velocidade informada é inválida.");
    if (heading != null && (heading < 0 || heading > 360))
      throw ApiException.invalid("A direção informada é inválida.");
    int changed =
        db.jdbc.update(
            "UPDATE ride_driver_availability SET lat=?,lng=?,accuracy_m=?,speed_mps=?,heading=?,"
                + " updated_at=now() WHERE user_id=? AND enabled=true AND status IN ('ONLINE','REQUESTED')",
            lat,
            lng,
            accuracyMeters,
            speedMps,
            heading,
            actor.id());
    if (changed == 0) throw ApiException.invalid("Ative sua disponibilidade antes de compartilhar localização.");
    var availability =
        db.one(
            "SELECT campus_id,direction FROM ride_driver_availability WHERE user_id=?",
            actor.id());
    notifySearchingPassengers(
        (UUID) availability.get("campusId"), String.valueOf(availability.get("direction")));
  }

  @Transactional
  public void stopDriverAvailability(Actor actor) {
    db.jdbc.update(
        "UPDATE ride_driver_availability SET enabled=false,status='OFFLINE',"
            + " pending_match_id=NULL,updated_at=now() WHERE user_id=?",
        actor.id());
    notifyPublic();
  }

  public Object nearbyDrivers(Actor actor, UUID campusId, String direction) {
    if (!DIRECTIONS.contains(direction)) throw ApiException.invalid("Direção de carona inválida.");
    var requestRows =
        db.list(
            "SELECT id,search_started_at FROM ride WHERE owner_id=? AND campus_id=? AND direction=?"
                + " AND dispatch_mode='ON_DEMAND' AND type='REQUEST' AND status='OPEN'"
                + " ORDER BY created_at DESC LIMIT 1",
            actor.id(),
            campusId,
            direction);
    if (requestRows.isEmpty()) throw ApiException.forbidden();

    Instant started = Instant.parse(String.valueOf(requestRows.getFirst().get("searchStartedAt")));
    long age = Math.max(0, Duration.between(started, Instant.now()).toSeconds());
    double radius = age < 20 ? 5.0 : age < 50 ? 12.0 : 35.0;

    var request =
        db.one(
            "SELECT start_lat,start_lng,end_lat,end_lng FROM ride WHERE id=?",
            requestRows.getFirst().get("id"));
    double focusLat = number(request.get("startLat"));
    double focusLng = number(request.get("startLng"));
    double latDelta = radius / 111.0;
    double lngDelta =
        radius / Math.max(1.0, 111.0 * Math.cos(Math.toRadians(focusLat)));

    var rows =
        db.list(
            "SELECT a.user_id,a.lat,a.lng,a.heading,a.updated_at"
                + " FROM ride_driver_availability a"
                + " WHERE a.campus_id=? AND a.direction=? AND a.enabled=true AND a.status='ONLINE'"
                + " AND a.updated_at>now()-interval '90 seconds'"
                + " AND a.user_id<>?"
                + " AND a.lat BETWEEN ? AND ? AND a.lng BETWEEN ? AND ?"
                + " AND NOT EXISTS(SELECT 1 FROM user_block b WHERE"
                + " (b.user_id=? AND b.blocked_id=a.user_id) OR"
                + " (b.blocked_id=? AND b.user_id=a.user_id))"
                + " ORDER BY a.updated_at DESC LIMIT 50",
            campusId,
            direction,
            actor.id(),
            focusLat - latDelta,
            focusLat + latDelta,
            focusLng - lngDelta,
            focusLng + lngDelta,
            actor.id(),
            actor.id());
    var out = new ArrayList<Map<String, Object>>();
    for (var row : rows) {
      double km =
          RideMatchingService.haversine(
              focusLat, focusLng, number(row.get("lat")), number(row.get("lng")));
      if (km > radius) continue;
      var item = new LinkedHashMap<String, Object>();
      item.put(
          "id",
          "nearby-"
              + UUID.nameUUIDFromBytes(
                  ("ride-nearby:" + row.get("userId"))
                      .getBytes(StandardCharsets.UTF_8)));
      item.put("lat", snap(number(row.get("lat"))));
      item.put("lng", snap(number(row.get("lng"))));
      item.put("heading", row.get("heading"));
      item.put("distanceKm", round1(km));
      out.add(item);
      if (out.size() >= 12) break;
    }
    return Map.of("radiusKm", radius, "drivers", out);
  }

  public Object driverRequests(Actor actor) {
    var availability = availability(actor.id());
    if (availability == null || !"ONLINE".equals(availability.get("status"))) return List.of();

    UUID campusId = (UUID) availability.get("campusId");
    String direction = String.valueOf(availability.get("direction"));
    double driverLat = number(availability.get("lat"));
    double driverLng = number(availability.get("lng"));
    var rows =
        db.list(
            "SELECT r.id,r.owner_id,u.name passenger_name,"
                + " u.avatar_bytes IS NOT NULL passenger_has_avatar,r.origin_area,"
                + " r.start_label,r.start_lat,r.start_lng,r.end_label,r.end_lat,r.end_lng,"
                + " r.route_distance_m,r.route_duration_s,"
                + " r.search_started_at,coalesce(rep.rating,0) passenger_rating,"
                + " coalesce(rep.reviews,0) passenger_reviews"
                + " FROM ride r JOIN app_user u ON u.id=r.owner_id"
                + " LEFT JOIN ride_reputation_summary rep ON rep.reviewee_id=r.owner_id"
                + " WHERE r.dispatch_mode='ON_DEMAND' AND r.type='REQUEST' AND r.status='OPEN'"
                + " AND r.campus_id=? AND r.direction=? AND r.owner_id<>?"
                + " AND NOT EXISTS(SELECT 1 FROM ride_match m WHERE"
                + " (m.ride_id=r.id OR m.request_ride_id=r.id) AND m.status='ACCEPTED')"
                + " AND NOT EXISTS(SELECT 1 FROM user_block b WHERE"
                + " (b.user_id=? AND b.blocked_id=r.owner_id) OR"
                + " (b.blocked_id=? AND b.user_id=r.owner_id))"
                + " AND NOT EXISTS(SELECT 1 FROM ride_dispatch_attempt a WHERE"
                + " a.request_ride_id=r.id AND a.driver_id=? AND a.outcome='REJECTED'"
                + " AND a.updated_at>now()-interval '30 minutes')"
                + " ORDER BY r.search_started_at,r.id LIMIT 12",
            campusId,
            direction,
            actor.id(),
            actor.id(),
            actor.id(),
            actor.id());
    var candidates = new ArrayList<Map<String, Object>>();
    for (var row : rows) {
      double pickupLat = number(row.get("startLat"));
      double pickupLng = number(row.get("startLng"));
      double proximity = RideMatchingService.haversine(driverLat, driverLng, pickupLat, pickupLng);
      Instant searchStarted =
          row.get("searchStartedAt") == null
              ? Instant.now().minusSeconds(60)
              : Instant.parse(String.valueOf(row.get("searchStartedAt")));
      long searchAge = Math.max(0, Duration.between(searchStarted, Instant.now()).toSeconds());
      double searchRadius = searchAge < 20 ? 5.0 : searchAge < 50 ? 12.0 : 35.0;
      if (proximity > searchRadius) continue;
      var item = new LinkedHashMap<String, Object>(row);
      item.put("pickupDistanceKm", round1(proximity));
      item.put("etaMinutes", Math.max(1, (int) Math.ceil(proximity / 28.0 * 60.0)));
      item.put("detourMinutes", fallbackDetour(availability, row));
      item.put("score", score(item));
      candidates.add(item);
    }
    candidates.sort(
        Comparator.<Map<String, Object>, Double>comparing(r -> number(r.get("score")))
            .reversed()
            .thenComparingDouble(r -> number(r.get("pickupDistanceKm"))));

    // Route-aware detour for only the best few, avoiding a routing request for every candidate.
    for (int i = 0; i < Math.min(4, candidates.size()); i++) {
      var item = candidates.get(i);
      try {
        var base =
            asMap(
                maps.route(
                    List.of(
                        new RideMapService.Point(number(availability.get("startLat")), number(availability.get("startLng"))),
                        new RideMapService.Point(number(availability.get("endLat")), number(availability.get("endLng"))))));
        List<RideMapService.Point> via =
            direction.equals("TO_CAMPUS")
                ? List.of(
                    new RideMapService.Point(number(availability.get("startLat")), number(availability.get("startLng"))),
                    new RideMapService.Point(number(item.get("startLat")), number(item.get("startLng"))),
                    new RideMapService.Point(number(availability.get("endLat")), number(availability.get("endLng"))))
                : List.of(
                    new RideMapService.Point(number(availability.get("startLat")), number(availability.get("startLng"))),
                    new RideMapService.Point(number(item.get("endLat")), number(item.get("endLng"))),
                    new RideMapService.Point(number(availability.get("endLat")), number(availability.get("endLng"))));
        var detour = asMap(maps.route(via));
        int seconds =
            Math.max(
                0,
                ((Number) detour.get("durationSeconds")).intValue()
                    - ((Number) base.get("durationSeconds")).intValue());
        item.put("detourMinutes", Math.max(0, (int) Math.ceil(seconds / 60.0)));
        Object legsValue = detour.get("legDurationsSeconds");
        if (legsValue instanceof List<?> legs && !legs.isEmpty() && legs.getFirst() instanceof Number firstLeg)
          item.put("etaMinutes", Math.max(1, (int) Math.ceil(firstLeg.doubleValue() / 60.0)));
        item.put("score", score(item));
      } catch (RuntimeException ignored) {
        // Geometric fallback above keeps matching functional if routing is temporarily unavailable.
      }
    }
    candidates.sort(
        Comparator.<Map<String, Object>, Double>comparing(r -> number(r.get("score")))
            .reversed());
    return candidates.stream()
        .limit(6)
        .map(
            item -> {
              var safe = new LinkedHashMap<String, Object>();
              safe.put("id", item.get("id"));
              safe.put("ownerId", item.get("ownerId"));
              safe.put("passengerName", item.get("passengerName"));
              safe.put("passengerHasAvatar", item.get("passengerHasAvatar"));
              safe.put("area", item.get("originArea"));
              safe.put("passengerRating", item.get("passengerRating"));
              safe.put("passengerReviews", item.get("passengerReviews"));
              safe.put("pickupDistanceKm", item.get("pickupDistanceKm"));
              safe.put("etaMinutes", item.get("etaMinutes"));
              safe.put("detourMinutes", item.get("detourMinutes"));
              safe.put("score", item.get("score"));
              safe.put(
                  "approxLat",
                  snap(
                      "TO_CAMPUS".equals(direction)
                          ? number(item.get("startLat"))
                          : number(item.get("endLat"))));
              safe.put(
                  "approxLng",
                  snap(
                      "TO_CAMPUS".equals(direction)
                          ? number(item.get("startLng"))
                          : number(item.get("endLng"))));
              return safe;
            })
        .toList();
  }

  @Transactional
  public Object acceptRequest(Actor actor, UUID requestRideId) {
    var availability =
        db.one(
            "SELECT * FROM ride_driver_availability WHERE user_id=? FOR UPDATE",
            actor.id());
    if (!Boolean.TRUE.equals(availability.get("enabled"))
        || !"ONLINE".equals(availability.get("status")))
      throw ApiException.invalid("Fique disponível antes de aceitar uma solicitação.");
    if (activeAcceptedMatch(actor.id()) != null)
      throw ApiException.invalid("Você já possui uma carona ativa.");

    var request =
        db.one(
            "SELECT * FROM ride WHERE id=? FOR UPDATE",
            requestRideId);
    if (!"REQUEST".equals(request.get("type"))
        || !"OPEN".equals(request.get("status"))
        || !"ON_DEMAND".equals(request.get("dispatchMode")))
      throw ApiException.invalid("Esta solicitação não está mais disponível.");
    if (!Objects.equals(request.get("campusId"), availability.get("campusId"))
        || !Objects.equals(request.get("direction"), availability.get("direction")))
      throw ApiException.invalid("Esta solicitação não pertence à sua rota ativa.");
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM ride_match WHERE"
            + " (ride_id=? OR request_ride_id=?) AND status='ACCEPTED')",
        requestRideId,
        requestRideId))
      throw ApiException.invalid("Outro motorista já aceitou esta solicitação.");

    UUID passenger = (UUID) request.get("ownerId");
    UUID offer = UUID.randomUUID();
    UUID match = UUID.randomUUID();
    Instant now = Instant.now();

    db.jdbc.update(
        "INSERT INTO ride(id,owner_id,campus_id,type,origin_area,direction,departure_at,seats,status,"
            + " area_lat,area_lng,area_accuracy_m,trip_status,dispatch_mode,start_label,start_lat,start_lng,"
            + " end_label,end_lat,end_lng,search_started_at)"
            + " VALUES (?,?,?,?,?,?,?,?,'OPEN',?,?,?,'DRIVER_ON_THE_WAY','ON_DEMAND',?,?,?,?,?,?,now())",
        offer,
        actor.id(),
        request.get("campusId"),
        "OFFER",
        cleanRequired(String.valueOf(availability.get("startLabel")), 120),
        request.get("direction"),
        java.sql.Timestamp.from(now.plus(Duration.ofHours(2))),
        availability.get("seats"),
        snap(number(availability.get("lat"))),
        snap(number(availability.get("lng"))),
        availability.get("accuracyM"),
        availability.get("startLabel"),
        availability.get("startLat"),
        availability.get("startLng"),
        availability.get("endLabel"),
        availability.get("endLat"),
        availability.get("endLng"));

    boolean toCampus = "TO_CAMPUS".equals(request.get("direction"));
    db.jdbc.update(
        "INSERT INTO ride_match(id,ride_id,user_id,status,requested_by,request_ride_id,"
            + " driver_id,passenger_id,driver_confirmed,passenger_confirmed,meeting_point,pickup_lat,pickup_lng)"
            + " VALUES (?,?,?,'ACCEPTED',?,?,?,?,true,true,?,?,?)",
        match,
        offer,
        passenger,
        passenger,
        requestRideId,
        actor.id(),
        passenger,
        toCampus ? request.get("startLabel") : request.get("endLabel"),
        toCampus ? request.get("startLat") : request.get("endLat"),
        toCampus ? request.get("startLng") : request.get("endLng"));
    db.jdbc.update(
        "UPDATE ride SET status='COMPLETED' WHERE id=? AND status='OPEN'",
        requestRideId);
    db.jdbc.update(
        "UPDATE ride_driver_availability SET status='BUSY',offer_ride_id=?,pending_match_id=?,"
            + " updated_at=now() WHERE user_id=?",
        offer,
        match,
        actor.id());
    db.jdbc.update(
        "INSERT INTO ride_dispatch_attempt(request_ride_id,driver_id,match_id,outcome,score)"
            + " VALUES (?,?,?,'ACCEPTED',100) ON CONFLICT(request_ride_id,driver_id) DO UPDATE SET"
            + " match_id=EXCLUDED.match_id,outcome='ACCEPTED',updated_at=now()",
        requestRideId,
        actor.id(),
        match);
    notices.send(
        actor.id(),
        passenger,
        "RIDE_ACCEPTED",
        "ride:" + offer,
        match,
        "/caronas",
        "Motorista encontrado. Ele já está a caminho do ponto de embarque.");
    changed(offer, true);
    changed(requestRideId, true);
    log.info("ride_accepted mode=on_demand ride={} match={} driver={} passenger={}", offer, match, actor.id(), passenger);
    return Map.of("rideId", offer, "matchId", match, "status", "ACCEPTED");
  }

  @Transactional
  public void rejectRequest(Actor actor, UUID requestRideId) {
    db.jdbc.update(
        "INSERT INTO ride_dispatch_attempt(request_ride_id,driver_id,outcome)"
            + " VALUES (?,?,'REJECTED') ON CONFLICT(request_ride_id,driver_id) DO UPDATE SET"
            + " outcome='REJECTED',updated_at=now()",
        requestRideId,
        actor.id());
  }

  @Transactional
  public void recordMatchCancellation(
      Actor actor, UUID matchId, String reason, String note) {
    var row =
        db.one(
            "SELECT ride_id,driver_id,passenger_id FROM ride_match WHERE id=?",
            matchId);
    if (!actor.id().equals(row.get("driverId")) && !actor.id().equals(row.get("passengerId")))
      throw ApiException.forbidden();
    cancellation((UUID) row.get("rideId"), matchId, actor.id(), reason, note);
  }

  @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 15000, initialDelay = 12000)
  @Transactional
  public void dispatchSearchWaves() {
    for (var row :
        db.list(
            "SELECT id FROM ride WHERE dispatch_mode='ON_DEMAND' AND type='REQUEST'"
                + " AND status='OPEN' AND search_started_at>now()-interval '2 hours'"
                + " ORDER BY search_started_at LIMIT 100"))
      offerRequestToDrivers((UUID) row.get("id"));
  }

  @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 30000, initialDelay = 30000)
  @Transactional
  public void expireDriverAvailability() {
    int changed =
        db.jdbc.update(
            "UPDATE ride_driver_availability SET enabled=false,status='OFFLINE'"
                + " WHERE enabled=true AND status IN ('ONLINE','REQUESTED')"
                + " AND updated_at<now()-interval '90 seconds'");
    if (changed > 0) notifyPublic();
    db.jdbc.update(
        "DELETE FROM ride_dispatch_attempt WHERE outcome IN ('REJECTED','EXPIRED','CANCELLED')"
            + " AND updated_at<now()-interval '2 hours'");
  }

  private Map<String, Object> activeRequest(UUID user) {
    var rows =
        db.list(
            "SELECT r.id,r.campus_id,c.name campus_name,r.direction,r.start_label,r.start_lat,r.start_lng,"
                + " r.end_label,r.end_lat,r.end_lng,r.route_distance_m,r.route_duration_s,r.trip_status,"
                + " r.status,r.search_started_at FROM ride r JOIN academic_entry c ON c.id=r.campus_id"
                + " WHERE r.owner_id=? AND r.type='REQUEST' AND r.dispatch_mode='ON_DEMAND'"
                + " AND r.status='OPEN' ORDER BY r.created_at DESC LIMIT 1",
            user);
    return rows.isEmpty() ? null : rows.getFirst();
  }

  private Map<String, Object> activeMatch(UUID user) {
    var rows =
        db.list(
            "SELECT m.id,m.ride_id,m.request_ride_id,m.driver_id,m.passenger_id,m.status,"
                + " m.boarding_verified_at,m.boarded_at,m.meeting_point,m.pickup_lat,m.pickup_lng,"
                + " r.trip_status,r.status ride_status,r.direction,r.start_label,r.start_lat,r.start_lng,"
                + " r.end_label,r.end_lat,r.end_lng,r.campus_id,c.name campus_name,"
                + " pr.start_label passenger_start_label,pr.start_lat passenger_start_lat,"
                + " pr.start_lng passenger_start_lng,pr.end_label passenger_end_label,"
                + " pr.end_lat passenger_end_lat,pr.end_lng passenger_end_lng,"
                + " d.name driver_name,d.avatar_bytes IS NOT NULL driver_has_avatar,"
                + " d.banner_bytes IS NOT NULL driver_has_banner,"
                + " p.name passenger_name,p.avatar_bytes IS NOT NULL passenger_has_avatar,"
                + " p.banner_bytes IS NOT NULL passenger_has_banner,"
                + " v.brand vehicle_brand,v.model vehicle_model,"
                + " v.color vehicle_color,v.plate_hint"
                + " FROM ride_match m JOIN ride r ON r.id=m.ride_id"
                + " LEFT JOIN ride pr ON pr.id=m.request_ride_id"
                + " JOIN academic_entry c ON c.id=r.campus_id"
                + " JOIN app_user d ON d.id=m.driver_id JOIN app_user p ON p.id=m.passenger_id"
                + " LEFT JOIN ride_vehicle_profile v ON v.user_id=m.driver_id"
                + " WHERE (m.driver_id=? OR m.passenger_id=?) AND m.status='ACCEPTED'"
                + " AND r.status='OPEN' AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1",
            user,
            user);
    return rows.isEmpty() ? null : rows.getFirst();
  }

  private Map<String, Object> recentCompleted(UUID user) {
    var rows =
        db.list(
            "SELECT m.id,m.ride_id,m.request_ride_id,m.driver_id,m.passenger_id,m.status,"
                + " r.trip_status,r.status ride_status,r.direction,r.completed_at,"
                + " r.start_label,r.start_lat,r.start_lng,r.end_label,r.end_lat,r.end_lng,"
                + " r.campus_id,c.name campus_name,"
                + " pr.start_label passenger_start_label,pr.start_lat passenger_start_lat,"
                + " pr.start_lng passenger_start_lng,pr.end_label passenger_end_label,"
                + " pr.end_lat passenger_end_lat,pr.end_lng passenger_end_lng,"
                + " d.name driver_name,d.avatar_bytes IS NOT NULL driver_has_avatar,"
                + " p.name passenger_name,p.avatar_bytes IS NOT NULL passenger_has_avatar,"
                + " v.brand vehicle_brand,v.model vehicle_model,v.color vehicle_color,v.plate_hint,"
                + " EXISTS(SELECT 1 FROM ride_review rr WHERE rr.match_id=m.id"
                + " AND rr.reviewer_id=?) reviewed"
                + " FROM ride_match m JOIN ride r ON r.id=m.ride_id"
                + " LEFT JOIN ride pr ON pr.id=m.request_ride_id"
                + " JOIN academic_entry c ON c.id=r.campus_id"
                + " JOIN app_user d ON d.id=m.driver_id JOIN app_user p ON p.id=m.passenger_id"
                + " LEFT JOIN ride_vehicle_profile v ON v.user_id=m.driver_id"
                + " WHERE (m.driver_id=? OR m.passenger_id=?) AND m.status='ACCEPTED'"
                + " AND r.status='COMPLETED' AND r.completed_at>now()-interval '6 hours'"
                + " ORDER BY r.completed_at DESC,m.id DESC LIMIT 1",
            user,
            user,
            user);
    return rows.isEmpty() ? null : rows.getFirst();
  }

  private Map<String, Object> availability(UUID user) {
    var rows =
        db.list(
            "SELECT a.*,c.name campus_name FROM ride_driver_availability a"
                + " JOIN academic_entry c ON c.id=a.campus_id WHERE a.user_id=?",
            user);
    return rows.isEmpty() ? null : rows.getFirst();
  }

  private Map<String, Object> vehicle(UUID user) {
    var rows =
        db.list(
            "SELECT brand,model,color,model_year,seats,plate_hint FROM ride_vehicle_profile WHERE user_id=?",
            user);
    return rows.isEmpty() ? null : rows.getFirst();
  }

  private Map<String, Object> activeAcceptedMatch(UUID user) {
    var rows =
        db.list(
            "SELECT m.id FROM ride_match m JOIN ride r ON r.id=m.ride_id WHERE"
                + " (m.driver_id=? OR m.passenger_id=?) AND m.status='ACCEPTED'"
                + " AND r.status='OPEN' AND m.deleted_at IS NULL LIMIT 1",
            user,
            user);
    return rows.isEmpty() ? null : rows.getFirst();
  }

  private Map<String, Object> campus(UUID campusId) {
    var rows =
        db.list(
            "SELECT e.id,e.name,c.address_label,c.latitude,c.longitude,c.city,c.state,"
                + " i.name institution_name"
                + " FROM academic_entry e LEFT JOIN academic_campus c ON c.id=e.id"
                + " LEFT JOIN academic_institution i ON i.id=c.institution_id"
                + " WHERE e.id=? AND e.kind='CAMPUS' AND e.status='VERIFIED'",
            campusId);
    if (rows.isEmpty()) throw ApiException.invalid("Selecione um campus acadêmico válido.");

    var campus = new LinkedHashMap<String, Object>(rows.getFirst());
    if (campus.get("latitude") == null || campus.get("longitude") == null) {
      String query =
          clean(
              String.join(
                  ", ",
                  java.util.stream.Stream.of(
                          campus.get("addressLabel"),
                          campus.get("name"),
                          campus.get("institutionName"),
                          campus.get("city"),
                          campus.get("state"),
                          "Brasil")
                      .filter(Objects::nonNull)
                      .map(String::valueOf)
                      .map(String::strip)
                      .filter(value -> !value.isBlank())
                      .distinct()
                      .toList()),
              240);
      try {
        Object result = maps.search(query, null, null);
        if (result instanceof List<?> list && !list.isEmpty() && list.getFirst() instanceof Map<?, ?> first) {
          Object lat = first.get("lat");
          Object lng = first.get("lng");
          if (lat instanceof Number latitude && lng instanceof Number longitude) {
            campus.put("latitude", latitude.doubleValue());
            campus.put("longitude", longitude.doubleValue());
            Object label = first.get("label");
            if (label != null) campus.put("addressLabel", String.valueOf(label));
            db.jdbc.update(
                "UPDATE academic_campus SET latitude=?,longitude=?,"
                    + " address_label=COALESCE(NULLIF(address_label,''),?) WHERE id=?",
                latitude.doubleValue(),
                longitude.doubleValue(),
                label == null ? query : String.valueOf(label),
                campusId);
          }
        }
      } catch (RuntimeException ignored) {
        log.warn("ride_campus_geocode_failed campus={}", campusId);
      }
    }

    return campus;
  }

  private Map<String, Object> campusForActor(Actor actor, UUID campusId) {
    var campus = new LinkedHashMap<String, Object>(campus(campusId));
    if (campus.get("latitude") == null || campus.get("longitude") == null) {
      var saved =
          db.list(
              "SELECT campus_label_override,campus_lat_override,campus_lng_override"
                  + " FROM ride_user_mobility_pref WHERE user_id=? AND campus_id=?",
              actor.id(),
              campusId);
      if (!saved.isEmpty()) {
        var row = saved.getFirst();
        if (row.get("campusLatOverride") != null && row.get("campusLngOverride") != null) {
          campus.put("latitude", row.get("campusLatOverride"));
          campus.put("longitude", row.get("campusLngOverride"));
          if (row.get("campusLabelOverride") != null)
            campus.put("addressLabel", row.get("campusLabelOverride"));
        }
      }
    }
    if (campus.get("latitude") == null || campus.get("longitude") == null)
      throw ApiException.invalid(
          "Confirme a localização do seu campus no mapa antes de buscar uma carona.");
    return campus;
  }

  private Map<String, Object> campusForActorOrEndpoint(
      Actor actor,
      UUID campusId,
      String direction,
      String startLabel,
      double startLat,
      double startLng,
      String endLabel,
      double endLat,
      double endLng) {
    try {
      return campusForActor(actor, campusId);
    } catch (ApiException missingCampusLocation) {
      var campus = new LinkedHashMap<String, Object>(campus(campusId));
      double latitude = "TO_CAMPUS".equals(direction) ? endLat : startLat;
      double longitude = "TO_CAMPUS".equals(direction) ? endLng : startLng;
      String label = clean("TO_CAMPUS".equals(direction) ? endLabel : startLabel, 240);
      coordinate(latitude, longitude);
      campus.put("latitude", latitude);
      campus.put("longitude", longitude);
      if (label != null) campus.put("addressLabel", label);

      db.jdbc.update(
          "UPDATE ride_user_mobility_pref SET campus_label_override=?,"
              + " campus_lat_override=?,campus_lng_override=?,updated_at=now()"
              + " WHERE user_id=? AND campus_id=?",
          label,
          latitude,
          longitude,
          actor.id(),
          campusId);
      log.info(
          "ride_campus_endpoint_confirmed user={} campus={} direction={}",
          actor.id(),
          campusId,
          direction);
      return campus;
    }
  }

  private void ensureCampusEndpoint(
      String direction,
      Map<String, Object> campus,
      double startLat,
      double startLng,
      double endLat,
      double endLng) {
    double campusLat = number(campus.get("latitude"));
    double campusLng = number(campus.get("longitude"));
    double delta =
        direction.equals("TO_CAMPUS")
            ? RideMatchingService.haversine(endLat, endLng, campusLat, campusLng)
            : RideMatchingService.haversine(startLat, startLng, campusLat, campusLng);
    if (delta > 1.5)
      throw ApiException.invalid("A origem ou destino precisa ser o campus selecionado.");
  }

  private int fallbackDetour(Map<String, Object> availability, Map<String, Object> request) {
    String direction = String.valueOf(availability.get("direction"));
    double km =
        direction.equals("TO_CAMPUS")
            ? RideMatchingService.haversine(
                number(availability.get("startLat")),
                number(availability.get("startLng")),
                number(request.get("startLat")),
                number(request.get("startLng")))
            : RideMatchingService.haversine(
                number(request.get("endLat")),
                number(request.get("endLng")),
                number(availability.get("endLat")),
                number(availability.get("endLng")));
    return Math.max(0, (int) Math.ceil(km / 28.0 * 60.0));
  }

  private double score(Map<String, Object> item) {
    double proximity = number(item.get("pickupDistanceKm"));
    double detour = number(item.get("detourMinutes"));
    double rating = number(item.get("passengerRating"));
    return Math.max(0, 100 - proximity * 3.2 - detour * 2.2 + rating * 2.0);
  }

  private void offerRequestToDrivers(UUID requestRideId) {
    var requests =
        db.list(
            "SELECT r.id,r.owner_id,r.campus_id,r.direction,r.start_lat,r.start_lng,"
                + " r.search_started_at FROM ride r WHERE r.id=? AND r.type='REQUEST'"
                + " AND r.dispatch_mode='ON_DEMAND' AND r.status='OPEN'",
            requestRideId);
    if (requests.isEmpty()) return;
    var request = requests.getFirst();
    Instant started =
        request.get("searchStartedAt") == null
            ? Instant.now()
            : Instant.parse(String.valueOf(request.get("searchStartedAt")));
    long age = Math.max(0, Duration.between(started, Instant.now()).toSeconds());
    double radius = age < 20 ? 5.0 : age < 50 ? 12.0 : 35.0;
    double pickupLat = number(request.get("startLat"));
    double pickupLng = number(request.get("startLng"));
    double latDelta = radius / 111.0;
    double lngDelta =
        radius / Math.max(1.0, 111.0 * Math.cos(Math.toRadians(pickupLat)));

    var drivers =
        db.list(
            "SELECT a.user_id,a.lat,a.lng FROM ride_driver_availability a"
                + " WHERE a.campus_id=? AND a.direction=? AND a.enabled=true AND a.status='ONLINE'"
                + " AND a.updated_at>now()-interval '90 seconds'"
                + " AND a.lat BETWEEN ? AND ? AND a.lng BETWEEN ? AND ?"
                + " AND NOT EXISTS(SELECT 1 FROM user_block b WHERE"
                + " (b.user_id=? AND b.blocked_id=a.user_id) OR"
                + " (b.blocked_id=? AND b.user_id=a.user_id))"
                + " ORDER BY a.updated_at DESC LIMIT 50",
            request.get("campusId"),
            request.get("direction"),
            pickupLat - latDelta,
            pickupLat + latDelta,
            pickupLng - lngDelta,
            pickupLng + lngDelta,
            request.get("ownerId"),
            request.get("ownerId"));

    int offered = 0;
    for (var driver : drivers) {
      double km =
          RideMatchingService.haversine(
              pickupLat,
              pickupLng,
              number(driver.get("lat")),
              number(driver.get("lng")));
      if (km > radius) continue;
      UUID driverId = (UUID) driver.get("userId");
      int inserted =
          db.jdbc.update(
              "INSERT INTO ride_dispatch_attempt(request_ride_id,driver_id,outcome)"
                  + " VALUES (?,?,'OFFERED') ON CONFLICT(request_ride_id,driver_id) DO NOTHING",
              requestRideId,
              driverId);
      if (inserted == 0) continue;
      notices.send(
          (UUID) request.get("ownerId"),
          driverId,
          "RIDE_REQUESTED",
          "ride-dispatch:" + requestRideId,
          requestRideId,
          "/caronas",
          "Há um estudante procurando carona no seu caminho.");
      offered++;
      if (offered >= 12) break;
    }
    if (offered > 0)
      log.info("driver_matched ride={} candidates={} radius_km={}", requestRideId, offered, radius);
  }

  private void cancellation(UUID ride, UUID match, UUID actor, String reason, String note) {
    String category = clean(reason, 40);
    if (category == null || category.isBlank()) category = "OTHER";
    db.jdbc.update(
        "INSERT INTO ride_cancellation(id,ride_id,match_id,actor_id,reason,note)"
            + " VALUES (?,?,?,?,?,?)",
        UUID.randomUUID(),
        ride,
        match,
        actor,
        category,
        clean(note, 300));
  }

  private void changed(UUID ride, boolean publicListing) {
    Set<UUID> users = new HashSet<>();
    for (var row :
        db.list(
            "SELECT owner_id user_id FROM ride WHERE id=?"
                + " UNION SELECT driver_id FROM ride_match WHERE ride_id=?"
                + " UNION SELECT passenger_id FROM ride_match WHERE ride_id=?",
            ride,
            ride,
            ride))
      if (row.get("userId") != null) users.add((UUID) row.get("userId"));
    events.publishEvent(new RideChanged(Set.copyOf(users), publicListing));
  }

  private void notifySearchingPassengers(UUID campusId, String direction) {
    Set<UUID> users = new HashSet<>();
    for (var row :
        db.list(
            "SELECT owner_id user_id FROM ride WHERE campus_id=? AND direction=?"
                + " AND dispatch_mode='ON_DEMAND' AND type='REQUEST' AND status='OPEN'",
            campusId,
            direction))
      if (row.get("userId") != null) users.add((UUID) row.get("userId"));
    if (!users.isEmpty()) events.publishEvent(new RideChanged(Set.copyOf(users), false));
  }

  private void notifyPublic() {
    events.publishEvent(new RideChanged(Set.of(), true));
  }

  @SuppressWarnings("unchecked")
  private static Map<String, Object> asMap(Object value) {
    return (Map<String, Object>) value;
  }

  private static String cleanRequired(String value, int max) {
    String out = clean(value, max);
    if (out == null || out.isBlank()) throw ApiException.invalid("Preencha os dados da rota.");
    return out;
  }

  private static String clean(String value, int max) {
    if (value == null) return null;
    String out = value.strip();
    return out.length() > max ? out.substring(0, max) : out;
  }

  private static void coordinate(double lat, double lng) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
      throw ApiException.invalid("A coordenada informada é inválida.");
  }

  private static Double snap(Double value) {
    return value == null ? null : Math.round(value * 1000.0) / 1000.0;
  }

  private static double number(Object value) {
    return value == null ? 0 : ((Number) value).doubleValue();
  }

  private static double round1(double value) {
    return Math.round(value * 10.0) / 10.0;
  }
}
