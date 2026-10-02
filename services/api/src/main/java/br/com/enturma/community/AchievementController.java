package br.com.enturma.community;

import br.com.enturma.auth.Actor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/achievements")
public class AchievementController {
  private final AchievementService service;

  public AchievementController(AchievementService service) {
    this.service = service;
  }

  @PostMapping("/sync")
  public Object sync(@AuthenticationPrincipal Actor a) {
    return service.sync(a.id());
  }

  @GetMapping
  public Object list(@AuthenticationPrincipal Actor a) {
    return service.list(a.id());
  }
}
