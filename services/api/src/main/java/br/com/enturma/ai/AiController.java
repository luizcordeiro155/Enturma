package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/ai")
public class AiController {
  private final AiService ai;

  public AiController(AiService ai) {
    this.ai = ai;
  }

  public record Question(@Size(max = 2000) String question, @NotBlank String mode) {}

  @PostMapping
  public Object ask(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @Valid @RequestBody Question r) {
    return ai.ask(a, room, r.question() == null ? "" : r.question(), r.mode());
  }

  @PostMapping("/catch-up")
  public Object catchUp(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    return ai.ask(a, room, "", "CATCH_UP");
  }

  @PostMapping("/session-report")
  public Object sessionReport(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    return ai.ask(a, room, "", "SESSION_REPORT");
  }

  @PostMapping("/study-material")
  public Object studyMaterial(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    return ai.ask(a, room, "", "STUDY_MATERIAL");
  }

  @GetMapping("/artifacts")
  public Object artifacts(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    return ai.artifacts(a, room);
  }

  @GetMapping("/artifacts/{id}")
  public Object artifact(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id) {
    return ai.artifact(a, room, id);
  }
}
