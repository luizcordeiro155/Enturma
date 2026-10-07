package br.com.enturma.common;

import br.com.enturma.ai.AiProvider;
import br.com.enturma.materials.ObjectStorageService;
import br.com.enturma.voice.VoiceProvider;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/capabilities")
public class CapabilitiesController {
  private final AiProvider ai;
  private final VoiceProvider voice;
  private final ObjectStorageService storage;

  public CapabilitiesController(AiProvider ai, VoiceProvider voice, ObjectStorageService storage) {
    this.ai = ai;
    this.voice = voice;
    this.storage = storage;
  }

  @GetMapping
  public Object get() {
    return Map.of(
        "ai", ai.enabled(),
        "aiWebSearch", ai.webSearchEnabled(),
        "voice", voice.enabled(),
        "materials", storage.enabled(),
        "privateImageAttachments", true);
  }
}
