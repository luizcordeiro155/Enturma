package br.com.enturma.academics;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AcademicIdentityController {
  private final AcademicIdentityService service;
  public AcademicIdentityController(AcademicIdentityService service) { this.service = service; }
  public record Selection(@NotNull UUID institutionId, UUID campusId) {}
  public record Email(@NotBlank @jakarta.validation.constraints.Email @Size(max=254) String email) {}
  public record Token(@NotBlank @Size(max=100) String token) {}
  public record Document(@NotBlank @Size(max=80) String mime, @NotBlank @Size(max=2796204) String content) {}
  public record Domain(@NotNull UUID institutionId, @NotBlank @Size(max=253) String domain,
      @NotBlank String status, boolean shared, boolean allowSubdomains, @NotBlank @Size(max=1800) String sourceUrl) {}
  public record Review(@NotNull UUID requestId, boolean approve, @NotBlank @Size(min=5,max=1000) String reason) {}
  public record Support(@NotBlank @Size(min=10,max=2000) String message) {}
  public record Answer(@NotBlank @Size(min=5,max=2000) String response) {}

  @GetMapping("/auth/academic/support")
  public Object support(@AuthenticationPrincipal Actor actor) { return service.support(actor); }
  @PostMapping("/auth/academic/support")
  public Object support(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Support body) { return service.askSupport(actor, body.message()); }
  @PostMapping("/admin/academic-verification/support/{request}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void answer(@AuthenticationPrincipal Actor actor, @PathVariable UUID request, @Valid @RequestBody Answer body) { service.answerSupport(actor, request, body.response()); }

  @GetMapping("/auth/academic/status")
  public Object status(@AuthenticationPrincipal Actor actor) { return service.status(actor); }
  @GetMapping("/auth/academic/institutions")
  public Object institutions(@RequestParam(defaultValue="") @Size(max=200) String search,
      @RequestParam(defaultValue="0") int page) { return service.institutions(search, page); }
  @PutMapping("/auth/academic/institution")
  public Object select(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Selection body) {
    return service.choose(actor, body.institutionId(), body.campusId());
  }
  @PostMapping("/auth/academic/email")
  public Object email(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Email body) {
    return service.sendEmail(actor, body.email());
  }
  @PostMapping("/auth/academic/confirm")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void confirm(@Valid @RequestBody Token body) { service.confirm(body.token()); }
  @PostMapping("/auth/academic/document")
  public Object document(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Document body) {
    byte[] bytes;
    try { bytes = Base64.getDecoder().decode(body.content()); }
    catch (IllegalArgumentException ex) { throw ApiException.invalid("Arquivo inválido. Selecione o comprovante novamente."); }
    return service.submitDocument(actor, body.mime(), bytes);
  }
  @GetMapping("/admin/academic-verification")
  public Object administration(@AuthenticationPrincipal Actor actor, @RequestParam(defaultValue="0") int page) {
    return service.administration(actor, page);
  }
  @PutMapping("/admin/academic-verification/domains")
  public Object domain(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Domain body) {
    return service.saveDomain(actor, body.institutionId(), body.domain(), body.status(), body.shared(), body.allowSubdomains(), body.sourceUrl());
  }
  @GetMapping("/admin/academic-verification/{user}/documents/{request}")
  public ResponseEntity<byte[]> download(@AuthenticationPrincipal Actor actor, @PathVariable UUID user, @PathVariable UUID request) {
    var document = service.document(actor, user, request);
    String mime = (String) document.get("mime");
    String extension = switch(mime) { case "application/pdf" -> "pdf"; case "image/png" -> "png"; default -> "jpg"; };
    return ResponseEntity.ok().contentType(MediaType.parseMediaType(mime))
        .header("Cache-Control", "private, no-store").header("X-Content-Type-Options", "nosniff")
        .header("Content-Disposition", "attachment; filename=\"comprovante." + extension + "\"")
        .body((byte[]) document.get("content"));
  }
  @PostMapping("/admin/academic-verification/{user}/review")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void review(@AuthenticationPrincipal Actor actor, @PathVariable UUID user, @Valid @RequestBody Review body) {
    service.review(actor, user, body.requestId(), body.approve(), body.reason());
  }
}
