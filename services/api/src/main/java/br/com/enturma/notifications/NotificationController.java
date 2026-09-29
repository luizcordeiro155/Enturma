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

  public NotificationController(NotificationService service) {
    this.service = service;
  }

  @GetMapping("/inbox")
  public Object inbox(@AuthenticationPrincipal Actor a) {
    return service.inbox(a);
  }

  public record Read(
      @Size(max = 100) List<UUID> ids, @Size(max = 100) String context, boolean all) {}

  @PostMapping("/read")
  public void read(@AuthenticationPrincipal Actor a, @Valid @RequestBody Read input) {
    service.read(a, input.ids(), input.context(), input.all());
  }
}
