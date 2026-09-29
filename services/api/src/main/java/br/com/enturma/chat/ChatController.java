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

  public record MessageInput(
      UUID id,
      @Size(max = 4000) String body,
      UUID replyTo,
      ChatService.ImagePayload image) {}

  public record ReactionInput(
      @NotBlank @Size(max = 16) String emoji,
      boolean active) {}

  @GetMapping
  public Object list(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID room,
      @RequestParam(defaultValue = "0") int page) {
    return chat.messages(actor, room, page);
  }

  @PostMapping
  public Object send(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID room,
      @Valid @RequestBody MessageInput input) {
    return chat.send(actor, room, input.id(), input.body(), input.replyTo(), input.image());
  }

  @DeleteMapping("/{id}")
  public void delete(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID room,
      @PathVariable UUID id) {
    chat.delete(actor, room, id);
  }

  @PostMapping("/{id}/reactions")
  public void react(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID room,
      @PathVariable UUID id,
      @Valid @RequestBody ReactionInput input) {
    chat.setReaction(actor, room, id, input.emoji(), input.active());
  }
}
