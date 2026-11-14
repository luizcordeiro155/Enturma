package br.com.enturma.planner;

import br.com.enturma.auth.Actor;
import br.com.enturma.planner.StudySessionService.NewSession;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study/sessions")
public class StudySessionController {
  public record Turn(UUID id, String message) {}

  public record QuizRequest(UUID id) {}

  public record Answers(List<Integer> answers) {}

  public record Personality(String personality) {}

  public record Later(OffsetDateTime startsAt, Integer minutes) {}

  private final StudySessionService study;

  public StudySessionController(StudySessionService study) {
    this.study = study;
  }

  @GetMapping
  public Object upcoming(@AuthenticationPrincipal Actor a) {
    return study.upcoming(a);
  }

  @GetMapping("/due")
  public Object due(@AuthenticationPrincipal Actor a) {
    return study.due(a);
  }

  @PostMapping
  public Object create(@AuthenticationPrincipal Actor a, @RequestBody NewSession s) {
    return Map.of("id", study.create(a, s));
  }

  @GetMapping("/{id}")
  public Object detail(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return study.detail(a, id);
  }

  @PostMapping("/{id}/start")
  public Object start(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return study.start(a, id);
  }

  @PostMapping("/{id}/messages")
  public Object message(@AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Turn t) {
    return Map.of("id", study.message(a, id, t.id(), t.message()));
  }

  @PostMapping("/{id}/quiz")
  public Object quiz(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody QuizRequest q) {
    return Map.of("id", study.quiz(a, id, q.id()));
  }

  @PostMapping("/{id}/quiz/{quiz}/answers")
  public Object answer(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @PathVariable UUID quiz,
      @RequestBody Answers body) {
    return study.answer(a, id, quiz, body.answers());
  }

  @PutMapping("/{id}/personality")
  public void personality(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Personality p) {
    study.setPersonality(a, id, p.personality());
  }

  @PostMapping("/{id}/skip")
  public void skip(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.skip(a, id);
  }

  @PostMapping("/{id}/finish")
  public void finish(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.finish(a, id);
  }

  @PostMapping("/{id}/continue")
  public Object continueLater(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Later l) {
    return Map.of("id", study.continueLater(a, id, l.startsAt(), l.minutes()));
  }

  @DeleteMapping("/{id}")
  public void delete(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    study.delete(a, id);
  }
}
