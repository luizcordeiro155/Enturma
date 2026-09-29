package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/notebooks")
public class NotebookController {
  private final NotebookService service;

  public NotebookController(NotebookService service) {
    this.service = service;
  }

  public record Title(@NotBlank @Size(max = 120) String title) {}

  public record Source(
      @NotBlank @Size(max = 200) String title,
      @NotBlank String kind,
      @Size(max = 100000) String content,
      @Size(max = 2000) String url) {}

  public record Generation(
      @NotNull UUID id,
      @NotNull @Size(max = 2000) String question,
      @NotBlank String mode,
      @NotBlank String level,
      @NotEmpty @Size(max = 10) List<@NotNull UUID> sourceIds) {}

  @GetMapping
  public Object list(@AuthenticationPrincipal Actor a) {
    return service.list(a);
  }

  @PostMapping
  public Object create(@AuthenticationPrincipal Actor a, @Valid @RequestBody Title r) {
    return service.create(a, r.title());
  }

  @GetMapping("/{id}")
  public Object detail(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return service.detail(a, id);
  }

  @PutMapping("/{id}")
  public void rename(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Title r) {
    service.rename(a, id, r.title());
  }

  @DeleteMapping("/{id}")
  public void delete(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    service.delete(a, id);
  }

  @PostMapping("/{id}/sources")
  public Object source(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Source r) {
    return service.add(
        a, id, r.title(), r.kind(), r.content() == null ? "" : r.content(), r.url(), null);
  }

  @PostMapping(value = "/{id}/files", consumes = "multipart/form-data")
  public Object file(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestParam MultipartFile file)
      throws java.io.IOException {
    String name =
        Optional.ofNullable(file.getOriginalFilename())
            .orElse("documento")
            .replaceAll("[\\\\/\\r\\n]", "_");
    if (name.length() > 200) name = name.substring(name.length() - 200);
    return service.add(a, id, name, "DOCUMENT", null, null, file.getBytes());
  }

  @GetMapping("/{id}/sources/{source}")
  public Object read(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable UUID source) {
    return service.source(a, id, source);
  }

  @DeleteMapping("/{id}/sources/{source}")
  public void remove(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable UUID source) {
    service.removeSource(a, id, source);
  }

  @PostMapping("/{id}/generations")
  public Object generate(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Generation r) {
    return service.generate(a, id, r.id(), r.question(), r.mode(), r.level(), r.sourceIds());
  }
}
