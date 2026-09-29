package br.com.enturma.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  public record Register(
      @NotBlank @Size(max = 100) String name,
      @Pattern(regexp = "[a-zA-Z0-9_]{3,40}") @NotNull String username,
      @Email @NotBlank @Size(max = 254) String email,
      @NotNull @Size(min = 12, max = 72) String password,
      @NotBlank @Size(max = 150) String device) {}

  public record Login(
      @Email @NotBlank @Size(max = 254) String email,
      @NotNull @Size(min = 1, max = 72) String password,
      @NotBlank @Size(max = 150) String device) {}

  public record Token(@NotBlank @Size(max = 100) String token) {}

  public record EmailRequest(@Email @NotBlank @Size(max = 254) String email) {}

  public record Reset(
      @NotBlank @Size(max = 100) String token,
      @NotNull @Size(min = 12, max = 72) String password) {}

  @PostMapping("/register")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Object register(@Valid @RequestBody Register r) {
    return auth.register(r.name(), r.username(), r.email(), r.password(), r.device());
  }

  @PostMapping("/login")
  public Object login(@Valid @RequestBody Login r) {
    return auth.login(r.email(), r.password(), r.device());
  }

  @PostMapping("/refresh")
  public Object refresh(@Valid @RequestBody Token r) {
    return auth.refresh(r.token());
  }

  @PostMapping("/forgot-password")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void forgot(@Valid @RequestBody EmailRequest r) {
    auth.recover(r.email());
  }

  @PostMapping("/reset-password")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void reset(@Valid @RequestBody Reset r) {
    auth.consume(r.token(), "RESET", r.password());
  }

  @PostMapping("/verify-email")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void verify(@Valid @RequestBody Token r) {
    auth.consume(r.token(), "VERIFY", null);
  }

  @PostMapping("/logout")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void logout(@AuthenticationPrincipal Actor a) {
    auth.logout(a);
  }

  @GetMapping("/sessions")
  public Object sessions(@AuthenticationPrincipal Actor a) {
    return auth.sessions(a);
  }

  @DeleteMapping("/sessions/{id}")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void revoke(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    auth.revoke(a, id);
  }
}
