package br.com.enturma.rides;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.NotificationService;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RideMatchingService {
  private final Db db;
  private final NotificationService notices;
  private final ApplicationEventPublisher events;

  public RideMatchingService(Db db, NotificationService notices, ApplicationEventPublisher events) {
    this.db = db;
    this.notices = notices;
    this.events = events;
  }

  public List<Map<String, Object>> suggestions(Actor actor, UUID sourceRideId) {
    var source = ownedSource(actor, sourceRideId);
    String opposite = source.get("type").equals("OFFER") ? "REQUEST" : "OFFER";
    Instant departure = Instant.parse(String.valueOf(source.get("departureAt")));
    Instant min = departure.minus(Duration.ofMinutes(90));
    Instant max = departure.plus(Duration.ofMinutes(90));

    var rows =
        db.list(
            "SELECT r.id,r.owner_id,r.type,r.origin_area,r.direction,r.departure_at,r.seats,"
                + " r.area_lat,r.area_lng,u.name owner_name,c.name campus_name,"
                + " coalesce(rep.rating,0) rating,coalesce(rep.reviews,0) reviews,"
                + " v.brand vehicle_brand,v.model vehicle_model,v.color vehicle_color,"
                + " EXISTS(SELECT 1 FROM academic_enrollment ae WHERE ae.user_id=u.id)"
                + " verified_student,"
                + " (SELECT count(*) FROM ride_match m WHERE m.ride_id=r.id AND"
                + " m.status='ACCEPTED') accepted_seats"
                + " FROM ride r JOIN app_user u ON u.id=r.owner_id"
                + " JOIN academic_entry c ON c.id=r.campus_id"
                + " LEFT JOIN ride_reputation_summary rep ON rep.reviewee_id=r.owner_id"
                + " LEFT JOIN ride_vehicle_profile v ON v.user_id=r.owner_id"
                + " WHERE r.campus_id=? AND r.direction=? AND r.type=? AND r.status='OPEN'"
                + " AND r.departure_at BETWEEN ? AND ? AND r.owner_id<>?"
                + " AND NOT (r.type='REQUEST' AND EXISTS(SELECT 1 FROM ride_match mx"
                + " WHERE (mx.request_ride_id=r.id OR mx.ride_id=r.id)"
                + " AND mx.status='ACCEPTED'))"
                + " AND NOT EXISTS(SELECT 1 FROM user_block b WHERE"
                + " (b.user_id=? AND b.blocked_id=r.owner_id) OR"
                + " (b.blocked_id=? AND b.user_id=r.owner_id))"
                + " ORDER BY abs(extract(epoch FROM (r.departure_at-?::timestamptz))),r.id"
                + " LIMIT 100",
            source.get("campusId"),
            source.get("direction"),
            opposite,
            java.sql.Timestamp.from(min),
            java.sql.Timestamp.from(max),
            actor.id(),
            actor.id(),
            actor.id(),
            java.sql.Timestamp.from(departure));

    var result = new ArrayList<Map<String, Object>>();
    for (var row : rows) {
      Double distance = distance(source, row);
      if (distance != null && distance > 25.0) continue;
      result.add(decorate(source, row, distance));
    }
    result.sort(
        Comparator.<Map<String, Object>>comparingInt(r -> ((Number) r.get("rank")).intValue())
            .reversed()
            .thenComparingLong(r -> ((Number) r.get("timeDifferenceMinutes")).longValue()));
    return result.stream().limit(30).toList();
  }

  @Transactional
  public Object connect(Actor actor, UUID sourceRideId, UUID candidateRideId) {
    var source = ownedSource(actor, sourceRideId);
    var candidate =
        db.one(
            "SELECT id,owner_id,campus_id,type,origin_area,direction,departure_at,status,"
                + " area_lat,area_lng FROM ride WHERE id=?",
            candidateRideId);
    validatePair(actor, source, candidate);

    UUID offerRideId =
        source.get("type").equals("OFFER") ? (UUID) source.get("id") : (UUID) candidate.get("id");
    UUID requestRideId =
        source.get("type").equals("REQUEST") ? (UUID) source.get("id") : (UUID) candidate.get("id");
    UUID driverId =
        source.get("type").equals("OFFER") ? actor.id() : (UUID) candidate.get("ownerId");
    UUID passengerId =
        source.get("type").equals("REQUEST") ? actor.id() : (UUID) candidate.get("ownerId");

    db.list(
        "SELECT id FROM ride WHERE id IN (?,?) ORDER BY id FOR UPDATE",
        offerRideId,
        requestRideId);

    var offer = db.one("SELECT seats,status,departure_at FROM ride WHERE id=?", offerRideId);
    if (!"OPEN".equals(offer.get("status"))
        || Instant.parse(String.valueOf(offer.get("departureAt"))).isBefore(Instant.now()))
      throw ApiException.invalid("A oferta de carona não está mais disponível.");

    int accepted =
        db.jdbc.queryForObject(
                "SELECT count(*) FROM ride_match WHERE ride_id=? AND status='ACCEPTED'",
                Integer.class,
                offerRideId);
    String status = accepted >= ((Number) offer.get("seats")).intValue() ? "WAITLISTED" : "PENDING";

    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO ride_match(id,ride_id,user_id,status,requested_by,request_ride_id,driver_id,passenger_id,"
            + " driver_confirmed,passenger_confirmed)"
            + " VALUES (?,?,?,?,?,?,?,?,?,?)"
            + " ON CONFLICT(ride_id,user_id)"
            + " WHERE status IN ('PENDING','WAITLISTED','ACCEPTED') AND deleted_at IS NULL"
            + " DO NOTHING",
        id,
        offerRideId,
        passengerId,
        status,
        actor.id(),
        requestRideId,
        driverId,
        passengerId,
        actor.id().equals(driverId),
        actor.id().equals(passengerId));

    var row =
        db.one(
            "SELECT id,status FROM ride_match WHERE ride_id=? AND user_id=?"
                + " AND status IN ('PENDING','WAITLISTED','ACCEPTED') AND deleted_at IS NULL"
                + " ORDER BY created_at DESC,id DESC LIMIT 1",
            offerRideId,
            passengerId);
    UUID match = (UUID) row.get("id");
    UUID peer = actor.id().equals(driverId) ? passengerId : driverId;
    notices.send(
        actor.id(),
        peer,
        "RIDE_MATCH_SUGGESTION",
        "ride:" + offerRideId,
        match,
        "/caronas/matches?match=" + match,
        status.equals("WAITLISTED")
            ? "Você recebeu uma combinação de carona, mas as vagas estão ocupadas no momento."
            : "O Enturma encontrou uma combinação de carona compatível com o seu trajeto.");
    events.publishEvent(new RideChanged(Set.of(driverId, passengerId), true));
    return row;
  }

  private void validatePair(
      Actor actor, Map<String, Object> source, Map<String, Object> candidate) {
    if (!Objects.equals(source.get("campusId"), candidate.get("campusId"))
        || !Objects.equals(source.get("direction"), candidate.get("direction"))
        || Objects.equals(source.get("type"), candidate.get("type"))
        || !"OPEN".equals(candidate.get("status"))
        || Instant.parse(String.valueOf(candidate.get("departureAt"))).isBefore(Instant.now()))
      throw ApiException.invalid("Estas duas publicações não são compatíveis.");

    Duration gap =
        Duration.between(
                Instant.parse(String.valueOf(source.get("departureAt"))),
                Instant.parse(String.valueOf(candidate.get("departureAt"))))
            .abs();
    if (gap.compareTo(Duration.ofMinutes(90)) > 0)
      throw ApiException.invalid("Os horários destas caronas estão muito distantes.");

    Double distance = distance(source, candidate);
    if (distance != null && distance > 25.0)
      throw ApiException.invalid("As regiões estão distantes demais para este match automático.");

    if ("REQUEST".equals(candidate.get("type"))
        && requestFulfilled((UUID) candidate.get("id")))
      throw ApiException.invalid("Este pedido de carona já encontrou um motorista.");

    UUID candidateOwner = (UUID) candidate.get("ownerId");
    if (candidateOwner.equals(actor.id()))
      throw ApiException.invalid("Não é possível combinar duas publicações da mesma conta.");
    if (blocked(actor.id(), candidateOwner)) throw ApiException.forbidden();
  }

  private Map<String, Object> ownedSource(Actor actor, UUID id) {
    var source =
        db.one(
            "SELECT id,owner_id,campus_id,type,origin_area,direction,departure_at,status,"
                + " area_lat,area_lng FROM ride WHERE id=?",
            id);
    if (!actor.id().equals(source.get("ownerId"))) throw ApiException.forbidden();
    if (!"OPEN".equals(source.get("status"))
        || Instant.parse(String.valueOf(source.get("departureAt"))).isBefore(Instant.now()))
      throw ApiException.invalid("Esta publicação de carona não está mais ativa.");
    if ("REQUEST".equals(source.get("type"))
        && requestFulfilled((UUID) source.get("id")))
      throw ApiException.invalid("Este pedido de carona já encontrou um motorista.");
    return source;
  }

  private boolean requestFulfilled(UUID ride) {
    return db.exists(
        "SELECT EXISTS(SELECT 1 FROM ride_match WHERE"
            + " (ride_id=? OR request_ride_id=?) AND status='ACCEPTED')",
        ride,
        ride);
  }

  private boolean blocked(UUID a, UUID b) {
    return db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE"
            + " (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?))",
        a,
        b,
        b,
        a);
  }

  private Map<String, Object> decorate(
      Map<String, Object> source, Map<String, Object> row, Double distance) {
    Instant a = Instant.parse(String.valueOf(source.get("departureAt")));
    Instant b = Instant.parse(String.valueOf(row.get("departureAt")));
    long timeMinutes = Math.abs(Duration.between(a, b).toMinutes());
    int rank = 0;
    var reasons = new ArrayList<String>();

    if (timeMinutes <= 20) {
      rank += 3;
      reasons.add("Horário muito próximo");
    } else if (timeMinutes <= 45) {
      rank += 2;
      reasons.add("Horário compatível");
    } else {
      rank += 1;
      reasons.add("Dentro da janela de 90 minutos");
    }

    Integer detour = null;
    if (distance != null) {
      if (distance <= 3) {
        rank += 3;
        reasons.add("Regiões muito próximas");
      } else if (distance <= 8) {
        rank += 2;
        reasons.add("Regiões próximas");
      } else {
        rank += 1;
        reasons.add("Região ainda compatível");
      }
      detour = Math.max(1, (int) Math.ceil(distance / 25.0 * 60.0));
    } else {
      reasons.add("Distância será confirmada depois do match");
    }

    if (Boolean.TRUE.equals(row.get("verifiedStudent"))) {
      rank += 1;
      reasons.add("Vínculo acadêmico cadastrado");
    }
    double rating = number(row.get("rating"));
    if (rating >= 4.5) {
      rank += 1;
      reasons.add("Boa avaliação nas caronas");
    }

    int seats = ((Number) row.get("seats")).intValue();
    int accepted = ((Number) row.get("acceptedSeats")).intValue();
    boolean full = row.get("type").equals("OFFER") && accepted >= seats;
    if (full) reasons.add("Lotada agora: lista de espera disponível");

    String level = rank >= 7 ? "EXCELENTE" : rank >= 4 ? "BOA" : "COMPATIVEL";
    var out = new LinkedHashMap<String, Object>();
    out.put("id", row.get("id"));
    out.put("ownerId", row.get("ownerId"));
    out.put("ownerName", row.get("ownerName"));
    out.put("type", row.get("type"));
    out.put("originArea", row.get("originArea"));
    out.put("campusName", row.get("campusName"));
    out.put("departureAt", row.get("departureAt"));
    out.put("seats", seats);
    out.put("acceptedSeats", accepted);
    out.put("availableSeats", Math.max(0, seats - accepted));
    out.put("full", full);
    out.put("distanceKm", distance == null ? null : round(distance));
    out.put("estimatedDetourMinutes", detour);
    out.put("timeDifferenceMinutes", timeMinutes);
    out.put("matchLevel", level);
    out.put("rank", rank);
    out.put("reasons", reasons);
    out.put("rating", rating);
    out.put("reviews", ((Number) row.get("reviews")).intValue());
    out.put("verifiedStudent", Boolean.TRUE.equals(row.get("verifiedStudent")));
    out.put(
        "vehicle",
        row.get("vehicleBrand") == null
            ? null
            : row.get("vehicleBrand") + " " + row.get("vehicleModel") + " · " + row.get("vehicleColor"));
    return out;
  }

  private Double distance(Map<String, Object> a, Map<String, Object> b) {
    if (a.get("areaLat") == null
        || a.get("areaLng") == null
        || b.get("areaLat") == null
        || b.get("areaLng") == null) return null;
    return haversine(
        number(a.get("areaLat")),
        number(a.get("areaLng")),
        number(b.get("areaLat")),
        number(b.get("areaLng")));
  }

  public static double haversine(double lat1, double lng1, double lat2, double lng2) {
    double earthKm = 6371.0088;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double p1 = Math.toRadians(lat1);
    double p2 = Math.toRadians(lat2);
    double h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private static double round(double value) {
    return Math.round(value * 10.0) / 10.0;
  }

  private static double number(Object value) {
    return value == null ? 0 : ((Number) value).doubleValue();
  }
}
