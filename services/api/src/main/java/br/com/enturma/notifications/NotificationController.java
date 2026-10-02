package br.com.enturma.notifications;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
  private final NotificationService service;
  private final NotificationPreferences preferences;
  private final PushNotificationService push;

  public NotificationController(
      NotificationService service,
      NotificationPreferences preferences,
      PushNotificationService push) {
    this.preferences = preferences;
    this.service = service;
    this.push = push;
  }

  public record Preference(
      @jakarta.validation.constraints.NotBlank String category,
      boolean inApp,
      boolean email,
      Boolean push) {}

  public record PushDevice(
      @jakarta.validation.constraints.NotBlank @Size(max = 100) String installationId,
      @jakarta.validation.constraints.NotBlank @Size(max = 4096) String token,
      @jakarta.validation.constraints.NotBlank
      @jakarta.validation.constraints.Pattern(regexp = "ANDROID") String platform) {}

  @GetMapping("/preferences")
  public Object preferences(@AuthenticationPrincipal Actor a) {
    return preferences.list(a);
  }

  @PutMapping("/preferences")
  public void preference(@AuthenticationPrincipal Actor a, @Valid @RequestBody Preference p) {
    preferences.save(a, p.category(), p.inApp(), p.email(), p.push());
  }

  @PostMapping("/push-device")
  public void registerPush(@AuthenticationPrincipal Actor a, @Valid @RequestBody PushDevice device) {
    push.register(a, device.installationId(), device.token(), device.platform());
  }

  @DeleteMapping("/push-device/{installationId}")
  public void unregisterPush(
      @AuthenticationPrincipal Actor a, @PathVariable @Size(max = 100) String installationId) {
    push.unregister(a, installationId);
  }

  @GetMapping("/inbox")
  public Object inbox(@AuthenticationPrincipal Actor a) {
    return service.inbox(a);
  }

  @PostMapping("/clear")
  public void clear(@AuthenticationPrincipal Actor a) {
    service.clear(a);
  }

  public record Read(
      @Size(max = 100) List<UUID> ids, @Size(max = 100) String context, boolean all) {}

  @PostMapping("/read")
  public void read(@AuthenticationPrincipal Actor a, @Valid @RequestBody Read input) {
    service.read(a, input.ids(), input.context(), input.all());
  }
}
