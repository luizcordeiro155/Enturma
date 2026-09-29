package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users/me")
public class ProfileController {
  private final ProfileService profiles;

  public ProfileController(ProfileService profiles) {
    this.profiles = profiles;
  }

  public record Enrollment(
      @NotNull UUID periodId,
      @NotEmpty @Size(max = 30) List<@NotNull UUID> subjectIds,
      @NotBlank String shift,
      @NotNull @Size(max = 500) String preferences) {}

  public record Appearance(
      @NotBlank @Size(min = 2, max = 100) String name,
      @Size(max = 280) String bio,
      @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String accentColor) {}

  @GetMapping
  public Object me(@AuthenticationPrincipal Actor a) {
    return profiles.me(a);
  }

  @PutMapping("/appearance")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void appearance(@AuthenticationPrincipal Actor a, @Valid @RequestBody Appearance r) {
    profiles.updateAppearance(a, r.name(), r.bio(), r.accentColor());
  }

  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void avatar(@AuthenticationPrincipal Actor a, @RequestParam MultipartFile file)
      throws java.io.IOException {
    profiles.saveAvatar(a, file.getContentType(), file.getBytes());
  }

  @PostMapping(value = "/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void banner(@AuthenticationPrincipal Actor a, @RequestParam MultipartFile file)
      throws java.io.IOException {
    profiles.saveBanner(a, file.getContentType(), file.getBytes());
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

  @PutMapping("/enrollment")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void enroll(@AuthenticationPrincipal Actor a, @Valid @RequestBody Enrollment r) {
    profiles.enroll(a, r.periodId(), r.subjectIds(), r.shift(), r.preferences());
  }
}
