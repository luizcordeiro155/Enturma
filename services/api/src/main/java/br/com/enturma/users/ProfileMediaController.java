package br.com.enturma.users;

import java.util.UUID;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class ProfileMediaController {
  private final ProfileService profiles;

  public ProfileMediaController(ProfileService profiles) {
    this.profiles = profiles;
  }

  @GetMapping("/{userId}/avatar")
  public ResponseEntity<byte[]> avatar(@PathVariable UUID userId) {
    var image = profiles.avatar(userId);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.mime()))
        .header("Cache-Control", "private, max-age=300")
        .body(image.bytes());
  }

  @GetMapping("/{userId}/banner")
  public ResponseEntity<byte[]> banner(@PathVariable UUID userId) {
    var image = profiles.banner(userId);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType(image.mime()))
        .header("Cache-Control", "private, max-age=300")
        .body(image.bytes());
  }
}
