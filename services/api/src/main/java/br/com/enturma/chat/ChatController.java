package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/messages")
public class ChatController {
  private final ChatService chat;

  public ChatController(ChatService chat) {
    this.chat = chat;
  }

  public record Message(@NotBlank @Size(max = 4000) String body, UUID replyTo) {}

  @GetMapping
  public Object list(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID room,
      @RequestParam(defaultValue = "0") int page) {
    return chat.messages(a, room, page);
  }

  @PostMapping
  public Object send(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @Valid @RequestBody Message r) {
    return chat.send(a, room, r.body(), r.replyTo());
  }

  @PutMapping("/{id}")
  public void edit(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID room,
      @PathVariable UUID id,
      @Valid @RequestBody Message r) {
    chat.edit(a, room, id, r.body());
  }

  @DeleteMapping("/{id}")
  public void delete(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id) {
    chat.delete(a, room, id);
  }
}
