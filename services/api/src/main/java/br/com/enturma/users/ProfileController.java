package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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

  @GetMapping
  public Object me(@AuthenticationPrincipal Actor a) {
    return profiles.me(a);
  }

  @PutMapping("/enrollment")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void enroll(@AuthenticationPrincipal Actor a, @Valid @RequestBody Enrollment r) {
    profiles.enroll(a, r.periodId(), r.subjectIds(), r.shift(), r.preferences());
  }
}
