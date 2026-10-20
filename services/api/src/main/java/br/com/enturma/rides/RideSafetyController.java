package br.com.enturma.rides;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/matches")
public class RideSafetyController {
  private final Db db;
  private final RideMapService maps;
  private final ObjectMapper json;
  private final NotificationService notices;
  private final ApplicationEventPublisher events;
  private final ExecutorService worker =
      Executors.newSingleThreadExecutor(Thread.ofVirtual().name("ride-safety-", 0).factory());
  private final AtomicBoolean running = new AtomicBoolean();

  public RideSafetyController(
      Db db,
      RideMapService maps,
      ObjectMapper json,
      NotificationService notices,
      ApplicationEventPublisher events) {
    this.db = db;
    this.maps = maps;
    this.json = json;
    this.notices = notices;
    this.events = events;
  }

  private Map<String, Object> access(Actor actor, UUID id) {
    var row =
        db.one(
            "SELECT m.passenger_id,m.driver_id,m.boarded_at,r.trip_status FROM ride_match m JOIN"
                + " ride r ON r.id=m.ride_id WHERE m.id=? AND m.status='ACCEPTED' AND m.deleted_at"
                + " IS NULL",
            id);
    if (!actor.id().equals(row.get("passengerId")) && !actor.id().equals(row.get("driverId")))
      throw ApiException.forbidden();
    return row;
  }

  @GetMapping("/{id}/safety-check")
  public Object status(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    var trip = access(actor, id);
    boolean active = "IN_PROGRESS".equals(trip.get("tripStatus"));
    var checks =
        db.list(
            "SELECT alert_kind,alert_at,acknowledged_at,expected_seconds,baseline_at,updated_at"
                + " FROM ride_safety_check WHERE match_id=?",
            id);
    var out = new LinkedHashMap<String, Object>();
    out.put("active", active);
    boolean fresh =
        db.exists(
            "SELECT EXISTS(SELECT 1 FROM ride_live_location l WHERE l.match_id=? AND l.user_id=?"
                + " AND l.accuracy_m<=100 AND l.captured_at>now()-interval '90 seconds')",
            id,
            trip.get("driverId"));
    out.put(
        "monitoring",
        active && fresh && !checks.isEmpty() && checks.getFirst().get("baselineAt") != null);
    if (active && actor.id().equals(trip.get("passengerId")) && !checks.isEmpty()) {
      var check = checks.getFirst();
      out.putAll(check);
      out.put("pending", check.get("alertAt") != null && check.get("acknowledgedAt") == null);
    } else out.put("pending", false);
    return out;
  }

  @PostMapping("/{id}/safety-check/okay")
  public void okay(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    var trip = access(actor, id);
    if (!actor.id().equals(trip.get("passengerId"))) throw ApiException.forbidden();
    db.jdbc.update(
        "UPDATE ride_safety_check SET acknowledged_at=now(),snoozed_until=now()+interval '10"
            + " minutes',off_route_since=NULL WHERE match_id=? AND alert_at IS NOT NULL",
        id);
    events.publishEvent(new RideChanged(Set.of(actor.id()), false));
  }

  @Scheduled(fixedDelay = 20000, initialDelay = 45000)
  public void schedule() {
    if (!running.compareAndSet(false, true)) return;
    worker.submit(
        () -> {
          try {
            scan();
          } finally {
            running.set(false);
          }
        });
  }

  @jakarta.annotation.PreDestroy
  public void stop() {
    worker.shutdownNow();
  }

  public void scan() {
    var rows =
        db.list(
            "SELECT"
                + " m.id,m.driver_id,m.passenger_id,m.boarded_at,coalesce(m.pickup_lat,r.start_lat,l.lat)"
                + " origin_lat,coalesce(m.pickup_lng,r.start_lng,l.lng)"
                + " origin_lng,coalesce(pr.end_lat,r.end_lat)"
                + " destination_lat,coalesce(pr.end_lng,r.end_lng)"
                + " destination_lng,l.lat,l.lng,l.accuracy_m,l.captured_at FROM ride_match m JOIN"
                + " ride r ON r.id=m.ride_id LEFT JOIN ride pr ON pr.id=m.request_ride_id JOIN"
                + " ride_live_location l ON l.match_id=m.id AND l.user_id=m.driver_id WHERE"
                + " r.trip_status='IN_PROGRESS' AND r.status='OPEN' AND m.status='ACCEPTED' AND"
                + " m.boarded_at IS NOT NULL AND m.deleted_at IS NULL AND"
                + " l.captured_at>now()-interval '90 seconds' AND l.accuracy_m<=100 ORDER BY"
                + " l.captured_at LIMIT 100");
    for (var row : rows) {
      try {
        inspect(row, Instant.now());
      } catch (Exception ignored) {
        // A routing outage must not be reported as a safe trip, nor interrupt rides.
      }
    }
    db.jdbc.update(
        "DELETE FROM ride_safety_check c USING ride_match m,ride r WHERE c.match_id=m.id AND"
            + " m.ride_id=r.id AND r.status IN ('COMPLETED','CANCELLED') AND"
            + " c.updated_at<now()-interval '24 hours'");
  }

  @SuppressWarnings("unchecked")
  void inspect(Map<String, Object> trip, Instant now) throws Exception {
    UUID id = (UUID) trip.get("id");
    if (trip.get("destinationLat") == null || trip.get("destinationLng") == null) return;
    var rows = db.list("SELECT * FROM ride_safety_check WHERE match_id=?", id);
    if (rows.isEmpty() || rows.getFirst().get("route") == null) {
      var route =
          (Map<String, Object>)
              maps.route(
                  List.of(
                      new RideMapService.Point(
                          number(trip.get("originLat")), number(trip.get("originLng"))),
                      new RideMapService.Point(
                          number(trip.get("destinationLat")), number(trip.get("destinationLng")))));
      if (!(route.get("geometry") instanceof List<?> geometry) || geometry.size() < 2) return;
      db.jdbc.update(
          "INSERT INTO ride_safety_check(match_id,route,expected_seconds,baseline_at) VALUES"
              + " (?,?::jsonb,?,now()) ON CONFLICT(match_id) DO NOTHING",
          id,
          json.writeValueAsString(geometry),
          Math.max(60, ((Number) route.get("durationSeconds")).intValue()));
      return;
    }
    var check = rows.getFirst();
    Instant captured = Instant.parse(String.valueOf(trip.get("capturedAt")));
    if (check.get("lastSampleAt") != null
        && !captured.isAfter(Instant.parse(String.valueOf(check.get("lastSampleAt"))))) return;
    Object raw = check.get("route");
    List<List<Number>> geometry =
        raw instanceof List<?>
            ? (List<List<Number>>) raw
            : json.readValue(String.valueOf(raw), List.class);
    double away = distanceFromRoute(number(trip.get("lat")), number(trip.get("lng")), geometry);
    Instant off =
        check.get("offRouteSince") == null
            ? null
            : Instant.parse(String.valueOf(check.get("offRouteSince")));
    if (away < 800) off = null;
    else if (off == null) off = captured;
    db.jdbc.update(
        "UPDATE ride_safety_check SET last_sample_at=?,off_route_since=?,updated_at=now() WHERE"
            + " match_id=?",
        java.sql.Timestamp.from(captured),
        off == null ? null : java.sql.Timestamp.from(off),
        id);
    if (check.get("alertAt") != null && check.get("acknowledgedAt") == null) return;
    if (check.get("snoozedUntil") != null
        && Instant.parse(String.valueOf(check.get("snoozedUntil"))).isAfter(now)) return;
    long elapsed =
        Duration.between(Instant.parse(String.valueOf(trip.get("boardedAt"))), now).toSeconds();
    double expected = number(check.get("expectedSeconds"));
    String kind =
        off != null && Duration.between(off, captured).toSeconds() >= 120
            ? "ROUTE"
            : elapsed > Math.max(expected * 1.8, expected + 900) ? "DURATION" : null;
    if (kind == null) return;
    int updated =
        db.jdbc.update(
            "UPDATE ride_safety_check SET alert_kind=?,alert_at=now(),acknowledged_at=NULL WHERE"
                + " match_id=? AND (alert_at IS NULL OR acknowledged_at IS NOT NULL) AND"
                + " EXISTS(SELECT 1 FROM ride_match m JOIN ride r ON r.id=m.ride_id WHERE m.id=?"
                + " AND r.trip_status='IN_PROGRESS' AND m.status='ACCEPTED' AND m.deleted_at IS NULL)",
            kind,
            id,
            id);
    if (updated > 0) {
      UUID passenger = (UUID) trip.get("passengerId");
      notices.send(
          (UUID) trip.get("driverId"),
          passenger,
          "RIDE_STATUS",
          "ride-safety:" + id,
          id,
          "/caronas/matches?match=" + id,
          "Tudo bem por aí? Confira o acompanhamento de segurança da sua carona.");
      events.publishEvent(new RideChanged(Set.of(passenger), false));
    }
  }

  static double distanceFromRoute(double lat, double lng, List<List<Number>> path) {
    double best = Double.POSITIVE_INFINITY, scale = Math.cos(Math.toRadians(lat)) * 111320;
    for (int i = 1; i < path.size(); i++) {
      double ax = (path.get(i - 1).get(1).doubleValue() - lng) * scale,
          ay = (path.get(i - 1).get(0).doubleValue() - lat) * 111320;
      double bx = (path.get(i).get(1).doubleValue() - lng) * scale,
          by = (path.get(i).get(0).doubleValue() - lat) * 111320;
      double dx = bx - ax, dy = by - ay, norm = dx * dx + dy * dy;
      double t = norm == 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / norm));
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
    return best;
  }

  private static double number(Object value) {
    return ((Number) value).doubleValue();
  }
}
