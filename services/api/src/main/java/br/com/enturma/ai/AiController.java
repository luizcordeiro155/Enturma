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

  public record Question(@NotBlank @Size(max = 2000) String question, @NotBlank String mode) {}

  @PostMapping
  public Object ask(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @Valid @RequestBody Question r) {
    return ai.ask(a, room, r.question(), r.mode());
  }
}
