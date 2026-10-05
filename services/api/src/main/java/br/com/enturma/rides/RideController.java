package br.com.enturma.rides;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class RideController {
  private final RideService rides;
  private final RideMatchingService matching;
  private final RideMobilityService mobility;
  private final RideDispatchService dispatch;
  private final RideMapService maps;

  public RideController(
      RideService rides,
      RideMatchingService matching,
      RideMobilityService mobility,
      RideDispatchService dispatch,
      RideMapService maps) {
    this.rides = rides;
    this.matching = matching;
    this.mobility = mobility;
    this.dispatch = dispatch;
    this.maps = maps;
  }

  public record Create(
      @NotNull UUID campusId,
      @NotBlank String type,
      @NotBlank @Size(max = 120) String originArea,
      @NotBlank String direction,
      @NotNull Instant departureAt,
      @Min(1) @Max(8) int seats,
      Double areaLat,
      Double areaLng,
      @Min(0) @Max(50000) Integer areaAccuracyMeters) {}

  public record Text(@NotBlank @Size(max = 2000) String body) {}

  public record Meeting(@NotBlank @Size(max = 500) String point) {}

  public record Review(
      @Min(1) @Max(5) int rating,
      @Min(1) @Max(5) Integer punctuality,
      @Min(1) @Max(5) Integer communication,
      @Min(1) @Max(5) Integer respect,
      Boolean responsible,
      @Size(max = 800) String comment) {}

  public record Status(@NotBlank String status) {}

  public record Boarding(@Pattern(regexp = "^[0-9]{4}$") String code) {}

  public record Location(
      @DecimalMin("-90") @DecimalMax("90") double lat,
      @DecimalMin("-180") @DecimalMax("180") double lng,
      @Min(0) @Max(50000) int accuracyMeters) {}

  public record Vehicle(
      @NotBlank @Size(max = 60) String brand,
      @NotBlank @Size(max = 80) String model,
      @NotBlank @Size(max = 40) String color,
      @Min(1980) @Max(2100) Integer modelYear,
      @Min(1) @Max(8) int seats,
      @Size(max = 8) String plateHint) {}

  public record Recurrence(
      @NotNull UUID campusId,
      @NotBlank String type,
      @NotBlank @Size(max = 120) String originArea,
      @NotBlank String direction,
      @NotNull java.time.LocalTime localTime,
      @NotBlank @Size(max = 64) String timezone,
      @NotEmpty java.util.List<@Min(1) @Max(7) Integer> weekdays,
      @Min(1) @Max(8) int seats,
      Double areaLat,
      Double areaLng,
      @Min(0) @Max(50000) Integer areaAccuracyMeters) {}

  public record Stops(@NotNull java.util.List<UUID> matchIds) {}

  public record PickupZone(
      @NotBlank @Size(max = 120) String name,
      @Size(max = 300) String description,
      @DecimalMin("-90") @DecimalMax("90") double lat,
      @DecimalMin("-180") @DecimalMax("180") double lng) {}

  public record MeetingZone(@NotNull UUID zoneId) {}

  public record MobilityPreference(
      @NotNull UUID campusId,
      @Size(max = 240) String homeLabel,
      Double homeLat,
      Double homeLng,
      boolean onboardingDone) {}

  public record DispatchSearch(
      @NotNull UUID campusId,
      @NotBlank String direction,
      @NotBlank @Size(max = 240) String startLabel,
      double startLat,
      double startLng,
      @NotBlank @Size(max = 240) String endLabel,
      double endLat,
      double endLng,
      @Min(0) int routeDistanceMeters,
      @Min(0) int routeDurationSeconds) {}

  public record DriverAvailability(
      @NotNull UUID campusId,
      @NotBlank String direction,
      @Min(1) @Max(8) int seats,
      @NotBlank @Size(max = 240) String startLabel,
      double startLat,
      double startLng,
      @NotBlank @Size(max = 240) String endLabel,
      double endLat,
      double endLng,
      double lat,
      double lng,
      @Min(0) @Max(50000) int accuracyMeters) {}

  public record DriverLocation(
      double lat,
      double lng,
      @Min(0) @Max(50000) int accuracyMeters,
      Double speedMps,
      Double heading) {}

  public record DispatchCancel(
      @NotBlank @Size(max = 40) String reason,
      @Size(max = 300) String note) {}

  public record RoutePoint(double lat, double lng) {}
  public record RouteRequest(@NotEmpty @Size(max = 8) java.util.List<@Valid RoutePoint> points) {}

  @GetMapping("/rides/mobility/state")
  public Object mobilityState(@AuthenticationPrincipal Actor a) {
    return dispatch.state(a);
  }

  @PutMapping("/rides/mobility/preferences")
  public Object mobilityPreference(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody MobilityPreference r) {
    return dispatch.savePreference(
        a, r.campusId(), r.homeLabel(), r.homeLat(), r.homeLng(), r.onboardingDone());
  }

  @GetMapping("/rides/map/search")
  public Object mapSearch(
      @RequestParam String q,
      @RequestParam(required = false) Double lat,
      @RequestParam(required = false) Double lng) {
    return maps.search(q, lat, lng);
  }

  @GetMapping("/rides/map/reverse")
  public Object mapReverse(@RequestParam double lat, @RequestParam double lng) {
    return maps.reverse(lat, lng);
  }

  @PostMapping("/rides/map/route")
  public Object mapRoute(@Valid @RequestBody RouteRequest r) {
    return maps.route(
        r.points().stream().map(p -> new RideMapService.Point(p.lat(), p.lng())).toList());
  }

  @PostMapping("/rides/dispatch/search")
  public Object dispatchSearch(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody DispatchSearch r) {
    return dispatch.startPassengerSearch(
        a,
        r.campusId(),
        r.direction(),
        r.startLabel(),
        r.startLat(),
        r.startLng(),
        r.endLabel(),
        r.endLat(),
        r.endLng(),
        r.routeDistanceMeters(),
        r.routeDurationSeconds());
  }

  @PostMapping("/rides/dispatch/cancel")
  public void dispatchCancel(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody DispatchCancel r) {
    dispatch.cancelPassengerSearch(a, r.reason(), r.note());
  }

  @PutMapping("/rides/driver/availability")
  public Object driverAvailability(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody DriverAvailability r) {
    return dispatch.setDriverAvailability(
        a,
        r.campusId(),
        r.direction(),
        r.seats(),
        r.startLabel(),
        r.startLat(),
        r.startLng(),
        r.endLabel(),
        r.endLat(),
        r.endLng(),
        r.lat(),
        r.lng(),
        r.accuracyMeters());
  }

  @PutMapping("/rides/driver/availability/location")
  public void driverAvailabilityLocation(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody DriverLocation r) {
    dispatch.updateDriverLocation(
        a, r.lat(), r.lng(), r.accuracyMeters(), r.speedMps(), r.heading());
  }

  @DeleteMapping("/rides/driver/availability")
  public void stopDriverAvailability(@AuthenticationPrincipal Actor a) {
    dispatch.stopDriverAvailability(a);
  }

  @GetMapping("/rides/driver/requests")
  public Object driverRequests(@AuthenticationPrincipal Actor a) {
    return dispatch.driverRequests(a);
  }

  @PostMapping("/rides/driver/requests/{id}/accept")
  public Object acceptDriverRequest(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return dispatch.acceptRequest(a, id);
  }

  @PostMapping("/rides/driver/requests/{id}/reject")
  public void rejectDriverRequest(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    dispatch.rejectRequest(a, id);
  }

  @GetMapping("/rides")
  public Object list(
      @AuthenticationPrincipal Actor a,
      @RequestParam(required = false) UUID campusId,
      @RequestParam(defaultValue = "0") int page) {
    return rides.list(a, campusId, page);
  }

  @GetMapping("/rides/mine")
  public Object mine(@AuthenticationPrincipal Actor a) {
    return rides.mine(a);
  }

  @PostMapping("/rides")
  public Object create(@AuthenticationPrincipal Actor a, @Valid @RequestBody Create r) {
    return rides.create(
        a,
        r.campusId(),
        r.type(),
        r.originArea(),
        r.direction(),
        r.departureAt(),
        r.seats(),
        r.areaLat(),
        r.areaLng(),
        r.areaAccuracyMeters());
  }

  @PostMapping("/rides/{id}/interest")
  public Object interest(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return rides.interest(a, id);
  }

  @GetMapping("/rides/{id}/suggestions")
  public Object suggestions(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return matching.suggestions(a, id);
  }

  @PostMapping("/rides/{source}/suggestions/{candidate}/connect")
  public Object connect(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID source,
      @PathVariable UUID candidate) {
    return matching.connect(a, source, candidate);
  }

  @PostMapping("/rides/{id}/status")
  public void status(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Status r) {
    mobility.tripStatus(a, id, r.status());
  }

  @GetMapping("/rides/vehicle")
  public Object vehicle(@AuthenticationPrincipal Actor a) {
    return mobility.vehicle(a);
  }

  @PutMapping("/rides/vehicle")
  public Object vehicle(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody Vehicle r) {
    return mobility.saveVehicle(
        a, r.brand(), r.model(), r.color(), r.modelYear(), r.seats(), r.plateHint());
  }

  @GetMapping("/rides/users/{id}/reputation")
  public Object reputation(@PathVariable UUID id) {
    return mobility.reputation(id);
  }

  @GetMapping("/rides/campuses/{campus}/pickup-zones")
  public Object pickupZones(@PathVariable UUID campus) {
    return mobility.pickupZones(campus);
  }

  @PostMapping("/admin/rides/campuses/{campus}/pickup-zones")
  public Object addPickupZone(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID campus,
      @Valid @RequestBody PickupZone r) {
    return mobility.addPickupZone(a, campus, r.name(), r.description(), r.lat(), r.lng());
  }

  @GetMapping("/rides/recurrences")
  public Object recurrences(@AuthenticationPrincipal Actor a) {
    return mobility.recurrences(a);
  }

  @PostMapping("/rides/recurrences")
  public Object recurrence(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody Recurrence r) {
    return mobility.createRecurrence(
        a,
        r.campusId(),
        r.type(),
        r.originArea(),
        r.direction(),
        r.localTime(),
        r.timezone(),
        r.weekdays(),
        r.seats(),
        r.areaLat(),
        r.areaLng(),
        r.areaAccuracyMeters());
  }

  @DeleteMapping("/rides/recurrences/{id}")
  public void recurrence(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    mobility.deleteRecurrence(a, id);
  }

  @PostMapping("/rides/{id}/stops")
  public void stops(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Stops r) {
    mobility.reorderPickups(a, id, r.matchIds());
  }

  @PostMapping("/rides/{id}/cancel")
  public void cancel(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    rides.finish(a, id, true);
  }

  @PostMapping("/rides/{id}/complete")
  public void complete(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    rides.finish(a, id, false);
  }

  @GetMapping("/matches")
  public Object matches(@AuthenticationPrincipal Actor a) {
    return rides.matches(a);
  }

  @PostMapping("/matches/{id}/accept")
  public void accept(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    rides.accept(a, id);
  }

  @PostMapping("/matches/{id}/confirm")
  public Object confirm(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return mobility.confirm(a, id);
  }

  @GetMapping("/matches/{id}/boarding-code")
  public Object boardingCode(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return mobility.boardingCode(a, id);
  }

  @PostMapping("/matches/{id}/board")
  public void board(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Boarding r) {
    mobility.board(a, id, r.code());
  }

  @PutMapping("/matches/{id}/location")
  public void location(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Location r) {
    mobility.liveLocation(a, id, r.lat(), r.lng(), r.accuracyMeters());
  }

  @GetMapping("/matches/{id}/location")
  public Object location(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return mobility.peerLocation(a, id);
  }

  @DeleteMapping("/matches/{id}/location")
  public void stopLocation(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    mobility.stopLiveLocation(a, id);
  }

  @PostMapping("/matches/{id}/safety-share")
  public Object safetyShare(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return mobility.createSafetyShare(a, id);
  }

  @DeleteMapping("/matches/safety-share/{id}")
  public void revokeSafetyShare(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    mobility.revokeSafetyShare(a, id);
  }

  @GetMapping("/public/rides/safety/{token}")
  public Object publicSafety(@PathVariable UUID token) {
    return mobility.publicSafety(token);
  }

  @PostMapping("/matches/{id}/no-show")
  public void noShow(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    mobility.noShow(a, id);
  }

  @PostMapping("/matches/{id}/cancel")
  public void cancelMatch(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    rides.cancelMatch(a, id);
  }

  @PostMapping("/matches/{id}/cancel-reason")
  public void cancelMatchWithReason(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody DispatchCancel r) {
    dispatch.recordMatchCancellation(a, id, r.reason(), r.note());
    rides.cancelMatch(a, id);
  }

  @PostMapping("/matches/{id}/close")
  public void closeConversation(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    rides.closeConversation(a, id);
  }

  @DeleteMapping("/matches/{id}/conversation")
  public void deleteConversation(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    rides.deleteConversation(a, id);
  }

  @GetMapping("/matches/{id}/messages")
  public Object messages(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "0") int page) {
    return rides.messages(a, id, page);
  }

  @PostMapping("/matches/{id}/messages")
  public void message(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Text r) {
    rides.message(a, id, r.body());
  }

  @PutMapping("/matches/{id}/meeting-point")
  public void point(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Meeting r) {
    rides.meeting(a, id, r.point());
  }

  @PutMapping("/matches/{id}/meeting-zone")
  public void zone(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody MeetingZone r) {
    mobility.meetingZone(a, id, r.zoneId());
  }

  @PostMapping("/matches/{id}/review")
  public void review(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Review r) {
    rides.review(
        a,
        id,
        r.rating(),
        r.punctuality(),
        r.communication(),
        r.respect(),
        r.responsible(),
        r.comment());
  }
}
