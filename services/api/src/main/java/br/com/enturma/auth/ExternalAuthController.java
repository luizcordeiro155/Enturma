package br.com.enturma.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Locale;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ExternalAuthController {
  private final ExternalAuthService external;

  public ExternalAuthController(ExternalAuthService external) {
    this.external = external;
  }

  /** Which providers this server offers. Client ids are public by design; secrets never leave. */
  @GetMapping("/public/auth/providers")
  public Object providers() {
    return external.providers();
  }

  public record GoogleSignIn(
      @NotBlank @Size(max = 2000) String code,
      @Size(max = 200) String codeVerifier,
      @NotBlank @Size(max = 150) String device,
      /** True when the person accepted the Terms and Privacy Policy and declared being 18+. */
      Boolean acceptedTerms) {}

  public record Code(@NotBlank @Size(max = 2000) String code, @Size(max = 200) String codeVerifier) {}

  @PostMapping("/auth/google")
  public Object google(@Valid @RequestBody GoogleSignIn r) {
    return external.google(
        r.code(), r.codeVerifier(), r.device(), Boolean.TRUE.equals(r.acceptedTerms()));
  }

  @PostMapping("/auth/google/link")
  public Object linkGoogle(@AuthenticationPrincipal Actor a, @Valid @RequestBody Code r) {
    external.linkGoogle(a, r.code(), r.codeVerifier());
    return external.identities(a);
  }

  @PostMapping("/auth/github/connect")
  public Object connectGithub(@AuthenticationPrincipal Actor a, @Valid @RequestBody Code r) {
    external.connectGithub(a, r.code(), r.codeVerifier());
    return external.identities(a);
  }

  @GetMapping("/auth/identities")
  public Object identities(@AuthenticationPrincipal Actor a) {
    return external.identities(a);
  }

  @DeleteMapping("/auth/identities/{provider}")
  public Object unlink(@AuthenticationPrincipal Actor a, @PathVariable String provider) {
    external.unlink(a, provider.toUpperCase(Locale.ROOT));
    return external.identities(a);
  }
}
