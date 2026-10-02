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

  public NotificationController(NotificationService service, NotificationPreferences preferences) {
    this.preferences = preferences;
    this.service = service;
  }

  public record Preference(
      @jakarta.validation.constraints.NotBlank String category, boolean inApp, boolean email) {}

  @GetMapping("/preferences")
  public Object preferences(@AuthenticationPrincipal Actor a) {
    return preferences.list(a);
  }

  @PutMapping("/preferences")
  public void preference(@AuthenticationPrincipal Actor a, @Valid @RequestBody Preference p) {
    preferences.save(a, p.category(), p.inApp(), p.email());
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
