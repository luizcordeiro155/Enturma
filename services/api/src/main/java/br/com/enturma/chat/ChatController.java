package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/messages")
public class ChatController {
  @GetMapping
  public Object list(@AuthenticationPrincipal Actor a, @PathVariable UUID room) {
    // Chat history is intentionally never persisted. Real-time messages exist only in clients' memory.
    return List.of();
  }

  @PostMapping
  public Object send() {
    throw new ApiException(
        410,
        "CHAT_REALTIME_E2EE_ONLY",
        "As mensagens desta sala são enviadas somente pelo chat criptografado em tempo real.");
  }

  @PutMapping("/{id}")
  public void edit() {
    throw new ApiException(
        410,
        "CHAT_REALTIME_E2EE_ONLY",
        "As mensagens desta sala não são armazenadas no servidor.");
  }

  @DeleteMapping("/{id}")
  public void delete() {
    throw new ApiException(
        410,
        "CHAT_REALTIME_E2EE_ONLY",
        "As mensagens desta sala não são armazenadas no servidor.");
  }
}
