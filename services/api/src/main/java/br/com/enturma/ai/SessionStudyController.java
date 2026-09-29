package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/study-summary")
public class SessionStudyController {
  private final SessionStudyService summaries;

  public SessionStudyController(SessionStudyService summaries) {
    this.summaries = summaries;
  }

  @GetMapping
  public Object get(@AuthenticationPrincipal Actor actor, @PathVariable UUID room) {
    return summaries.get(actor, room);
  }

  @PostMapping
  public Object request(@AuthenticationPrincipal Actor actor, @PathVariable UUID room) {
    return summaries.request(actor, room);
  }

  @PostMapping("/recap")
  public Object recap(@AuthenticationPrincipal Actor actor, @PathVariable UUID room) {
    return summaries.recap(actor, room);
  }
}
