package br.com.enturma.forum;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/forum")
public class ForumController {
  private final ForumService forum;

  public ForumController(ForumService forum) {
    this.forum = forum;
  }

  public record Post(
      @Size(max = 180) String title,
      @NotBlank @Size(max = 12000) String body,
      @Size(max = 30) String category) {}

  public record Comment(UUID parentId, @NotBlank @Size(max = 4000) String body) {}

  public record Vote(@Min(-1) @Max(1) int value) {}

  public record Reaction(@Size(max = 20) String emoji) {}

  @GetMapping("/highlights")
  public Object highlights(@AuthenticationPrincipal Actor a) {
    return forum.highlights(a);
  }

  @GetMapping
  public Object list(
      @AuthenticationPrincipal Actor a,
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "") String category,
      @RequestParam(defaultValue = "new") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "false") boolean mine) {
    return forum.list(a, q, category, sort, page, mine);
  }

  @PostMapping
  public Object create(@AuthenticationPrincipal Actor a, @Valid @RequestBody Post p) {
    return forum.create(a, p.title(), p.body(), p.category());
  }

  @GetMapping("/{id}")
  public Object detail(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return forum.detail(a, id);
  }

  @PutMapping("/{id}")
  public void edit(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Post p) {
    forum.edit(a, id, p.title(), p.body(), p.category());
  }

  @DeleteMapping("/{id}")
  public void delete(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    forum.delete(a, id);
  }

  @GetMapping("/{id}/comments")
  public Object comments(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "0") int page) {
    return forum.comments(a, id, page);
  }

  @PostMapping("/{id}/comments")
  public Object comment(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Comment c) {
    return forum.comment(a, id, c.parentId(), c.body());
  }

  @GetMapping("/{id}/related")
  public Object related(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return forum.related(a, id);
  }

  @PutMapping("/{id}/vote")
  public void vote(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Vote v) {
    forum.vote(a, id, v.value());
  }

  @PutMapping("/{id}/reaction")
  public void react(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Reaction r) {
    forum.react(a, id, r.emoji());
  }
}
