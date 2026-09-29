package br.com.enturma.moderation;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ModerationController {
  private final ModerationService moderation;

  public ModerationController(ModerationService moderation) {
    this.moderation = moderation;
  }

  public record Report(@NotNull UUID targetId, @NotBlank @Size(max = 2000) String reason) {}

  public record Status(@NotBlank String status) {}

  @GetMapping("/blocks")
  public Object blocks(@AuthenticationPrincipal Actor a) {
    return moderation.blocks(a);
  }

  @PostMapping("/blocks/{target}")
  public void block(@AuthenticationPrincipal Actor a, @PathVariable UUID target) {
    moderation.block(a, target);
  }

  @DeleteMapping("/blocks/{target}")
  public void unblock(@AuthenticationPrincipal Actor a, @PathVariable UUID target) {
    moderation.unblock(a, target);
  }

  @PostMapping("/reports")
  public void report(@AuthenticationPrincipal Actor a, @Valid @RequestBody Report r) {
    moderation.report(a, r.targetId(), r.reason());
  }

  @GetMapping("/notifications")
  public Object notifications(@AuthenticationPrincipal Actor a) {
    return moderation.notifications(a);
  }

  @PostMapping("/notifications/{id}/read")
  public void read(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    moderation.read(a, id);
  }

  @PutMapping("/admin/users/{id}/status")
  public void status(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Status r) {
    moderation.status(a, id, r.status());
  }
}
