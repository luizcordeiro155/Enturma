package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/study-rooms/{room}/messages")
public class ChatController {
  private final ChatService chat;

  public ChatController(ChatService chat) {
    this.chat = chat;
  }

  public record Message(@Size(max = 4000) String body, UUID replyTo, UUID attachmentId) {}

  @GetMapping
  public Object list(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room,
      @RequestParam(defaultValue = "0") int page) {
    return chat.messages(a, room, page);
  }

  @PostMapping
  public Object send(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @Valid @RequestBody Message r) {
    return chat.send(a, room, r.body(), r.replyTo(), r.attachmentId());
  }

  @PutMapping("/{id}")
  public void edit(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id,
      @Valid @RequestBody Message r) {
    chat.edit(a, room, id, r.body());
  }

  @DeleteMapping("/{id}")
  public void delete(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id) {
    chat.delete(a, room, id);
  }

  @PostMapping(value = "/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Object upload(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @RequestParam MultipartFile file)
      throws java.io.IOException {
    return chat.upload(a, room, file.getOriginalFilename(), file.getContentType(), file.getBytes());
  }

  @GetMapping("/attachments/{id}")
  public ResponseEntity<byte[]> attachment(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id) {
    var d = chat.download(a, room, id);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(d.mime()))
        .header("Cache-Control", "private, max-age=3600")
        .header(
            "Content-Disposition",
            ContentDisposition.inline()
                .filename(d.name(), StandardCharsets.UTF_8)
                .build()
                .toString())
        .body(d.body());
  }

  @GetMapping("/{id}/reactions")
  public Object reactions(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id) {
    return chat.reactions(a, room, id);
  }

  @PostMapping("/{id}/reactions")
  public void react(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id,
      @RequestParam String emoji) {
    chat.react(a, room, id, emoji);
  }

  @DeleteMapping("/{id}/reactions")
  public void unreact(
      @AuthenticationPrincipal Actor a, @PathVariable UUID room, @PathVariable UUID id,
      @RequestParam String emoji) {
    chat.unreact(a, room, id, emoji);
  }
}
