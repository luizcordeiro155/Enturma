package br.com.enturma.study;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-rooms")
public class StudyController {
  private final StudyService study;

  public StudyController(StudyService study) {
    this.study = study;
  }

  public record Create(
      @NotNull UUID subjectId,
      UUID topicId,
      @NotBlank @Size(max = 150) String title,
      @Min(25) @Max(180) int minutes,
      @Min(2) @Max(30) int maxParticipants,
      @Min(0) @Max(5) Integer days) {}

  @GetMapping
  public Object list(
      @AuthenticationPrincipal Actor a,
      @RequestParam(required = false) UUID subjectId,
      @RequestParam(defaultValue = "0") int page) {
    return study.list(a, subjectId, page);
  }

  @PostMapping
  public Object create(@AuthenticationPrincipal Actor a, @Valid @RequestBody Create r) {
    return study.create(
        a,
        r.subjectId(),
        r.topicId(),
        r.title(),
        r.minutes(),
        r.maxParticipants(),
        r.days() == null ? 0 : r.days());
  }

  public record Configure(
      @NotBlank @Size(max = 150) String title,
      @NotNull @Size(max = 500) String topic,
      boolean locked) {}

  @PutMapping("/{id}/settings")
  public void configure(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Configure r) {
    study.configure(a, id, r.title(), r.topic(), r.locked());
  }

  @PostMapping("/{id}/heartbeat")
  public void heartbeat(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.heartbeat(a, id);
  }

  @GetMapping("/{id}")
  public Object detail(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return study.detail(a, id);
  }

  @PostMapping("/{id}/join")
  public Object join(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.join(a, id);
    return study.detail(a, id);
  }

  @PostMapping("/{id}/end")
  public void end(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.end(a, id);
  }

  @PostMapping("/{id}/leave")
  public void leave(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.leave(a, id);
  }

  @DeleteMapping("/{id}/participants/{userId}")
  public void remove(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable UUID userId) {
    study.remove(a, id, userId);
  }
}
