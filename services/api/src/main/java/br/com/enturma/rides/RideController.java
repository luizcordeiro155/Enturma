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

  public RideController(RideService rides) {
    this.rides = rides;
  }

  public record Create(
      @NotNull UUID campusId,
      @NotBlank String type,
      @NotBlank @Size(max = 120) String originArea,
      @NotBlank String direction,
      @NotNull Instant departureAt,
      @Min(1) @Max(8) int seats) {}

  public record Text(@NotBlank @Size(max = 2000) String body) {}

  public record Meeting(@NotBlank @Size(max = 500) String point) {}

  public record Review(@Min(1) @Max(5) int rating) {}

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
        a, r.campusId(), r.type(), r.originArea(), r.direction(), r.departureAt(), r.seats());
  }

  @PostMapping("/rides/{id}/interest")
  public Object interest(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return rides.interest(a, id);
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

  @PostMapping("/matches/{id}/cancel")
  public void cancelMatch(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
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

  @PostMapping("/matches/{id}/review")
  public void review(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Review r) {
    rides.review(a, id, r.rating());
  }
}
