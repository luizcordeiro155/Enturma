package br.com.enturma.voice;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class PrivateCallController {
  private final PrivateCallService calls;

  public PrivateCallController(PrivateCallService calls) {
    this.calls = calls;
  }

  public record Invite(@NotNull UUID friendshipId, boolean video, @NotNull UUID deviceId) {}

  public record Device(UUID deviceId) {}

  @GetMapping("/friends/{id}/presence")
  public Object presence(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    return calls.presence(actor, id);
  }

  @GetMapping("/calls/private")
  public Object current(@AuthenticationPrincipal Actor actor) {
    return calls.current(actor);
  }

  @PostMapping("/calls/private")
  public Object create(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Invite invite) {
    return calls.create(actor, invite.friendshipId(), invite.video(), invite.deviceId());
  }

  @PostMapping("/calls/private/{id}/{action:accept|decline|cancel|end|ring}")
  public Object action(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID id,
      @PathVariable String action,
      @RequestBody(required = false) Device device) {
    return calls.transition(actor, id, action, device == null ? null : device.deviceId());
  }

  @PostMapping("/calls/private/{id}/voice")
  public Object join(
      @AuthenticationPrincipal Actor actor, @PathVariable UUID id, @RequestBody Device device) {
    return calls.join(actor, id, device.deviceId());
  }

  @PostMapping("/calls/private/{id}/heartbeat")
  public Object heartbeat(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    return calls.heartbeat(actor, id);
  }
}
