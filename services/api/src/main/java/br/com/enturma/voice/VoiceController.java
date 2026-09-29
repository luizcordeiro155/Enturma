package br.com.enturma.voice;

import br.com.enturma.auth.Actor;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/voice")
public class VoiceController {
  private final VoiceService voice;

  public VoiceController(VoiceService voice) {
    this.voice = voice;
  }

  @PostMapping
  public Object join(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    return voice.join(a, room);
  }
}
