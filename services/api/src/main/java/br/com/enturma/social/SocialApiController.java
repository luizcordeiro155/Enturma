package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/social")
public class SocialApiController {
  private final SocialPosts posts;
  private final SocialPeople people;
  private final SocialAccess access;
  private final SocialMedia media;
  private final SocialLives lives;

  public SocialApiController(
      SocialPosts posts, SocialPeople people, SocialAccess access, SocialMedia media, SocialLives lives) {
    this.posts = posts;
    this.people = people;
    this.access = access;
    this.media = media;
    this.lives = lives;
  }

  @GetMapping("/capabilities")
  public Object capabilities() {
    return Map.of("enabled", access.enabled(), "media", media.enabled(), "maxClipSeconds", 90, "live", lives.enabled());
  }

  @GetMapping("/feed")
  public Object feed(
      @AuthenticationPrincipal Actor a,
      @RequestParam(defaultValue = "for-you") String tab,
      @RequestParam(defaultValue = "POST") String kind,
      @RequestParam(defaultValue = "") String q,
      @RequestParam(defaultValue = "") String cursor,
      @RequestParam(required = false) UUID author,
      @RequestParam(defaultValue = "posts") String collection) {
    return posts.feed(a, tab, kind, q, cursor, author, collection);
  }

  @GetMapping("/posts/{id}")
  public Object detail(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return posts.detail(a, id);
  }

  @GetMapping("/drafts")
  public Object drafts(@AuthenticationPrincipal Actor a) {
    return posts.drafts(a);
  }

  @GetMapping("/mentions")
  public Object mentions(@AuthenticationPrincipal Actor a) {
    return posts.pendingMentions(a);
  }

  @GetMapping("/drafts/{id}")
  public Object draft(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return posts.ownDraft(a, id);
  }

  @PutMapping("/drafts")
  public Object draft(@AuthenticationPrincipal Actor a, @RequestBody SocialPosts.Draft draft) {
    return posts.draft(a, draft);
  }

  public record Version(@Min(1) int version) {}

  @PostMapping("/posts/{id}/publish")
  public Object publish(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @Valid @RequestBody Version version) {
    return posts.publish(a, id, version.version());
  }

  @DeleteMapping("/posts/{id}")
  public void remove(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    posts.remove(a, id);
  }

  public record Active(boolean active) {}

  @PutMapping("/posts/{id}/reactions/{kind}")
  public Object react(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @PathVariable String kind,
      @RequestBody Active body) {
    return posts.react(a, id, kind, body.active());
  }

  @PutMapping("/posts/{id}/pin")
  public void pin(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Active body) {
    posts.pin(a, id, body.active());
  }

  @PutMapping("/posts/{id}/mention")
  public void mention(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Active body) {
    posts.mention(a, id, body.active());
  }

  @GetMapping("/posts/{id}/comments")
  public Object comments(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "0") int page) {
    return posts.comments(a, id, page);
  }

  public record Comment(@NotNull UUID id, @NotNull @Size(max = 1500) String body, UUID parentId, UUID mediaId) {}

  @PostMapping("/posts/{id}/comments")
  public Object comment(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Comment body) {
    return posts.comment(a, id, body.id(), body.body(), body.parentId(), body.mediaId());
  }

  @DeleteMapping("/posts/{id}/comments/{comment}")
  public void deleteComment(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable UUID comment) {
    posts.deleteComment(a, id, comment);
  }

  public record View(@Min(0) @Max(90000) int watchedMs, boolean completed) {}

  @PutMapping("/posts/{id}/view")
  public void view(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody View body) {
    posts.view(a, id, body.watchedMs(), body.completed());
  }

  public record Highlight(@Size(max = 60) String title) {}

  @PutMapping("/posts/{id}/highlight")
  public void highlight(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Highlight body) {
    posts.highlight(a, id, body.title());
  }

  @GetMapping("/posts/{id}/viewers")
  public Object viewers(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "0") int page) {
    return posts.viewers(a, id, page);
  }

  @GetMapping("/people")
  public Object search(
      @AuthenticationPrincipal Actor a, @RequestParam(defaultValue = "") String q) {
    return people.search(a, q);
  }

  @GetMapping("/people/{id}")
  public Object profile(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return people.profile(a, id);
  }

  @GetMapping("/people/mentions")
  public Object mentionSuggestions(
      @AuthenticationPrincipal Actor a, @RequestParam(defaultValue = "") String q) {
    return people.mentionSuggestions(a, q);
  }

  @GetMapping("/people/{id}/highlights")
  public Object highlights(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    return posts.highlights(a, id);
  }

  @GetMapping("/people/{id}/connections")
  public Object connections(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "followers") String kind,
      @RequestParam(defaultValue = "0") int page) {
    return people.connections(a, id, kind, page);
  }

  @PutMapping("/people/{id}/follow")
  public Object follow(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Active body) {
    return people.follow(a, id, body.active());
  }

  @PutMapping("/people/{id}/request")
  public Object request(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Active body) {
    return people.decide(a, id, body.active());
  }

  @PutMapping("/people/{id}/mute")
  public void mute(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Active body) {
    people.mute(a, id, body.active());
  }

  @PutMapping("/people/{id}/notifications")
  public void notify(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @RequestBody Active body) {
    people.notify(a, id, body.active());
  }

  @GetMapping("/preferences")
  public Object preferences(@AuthenticationPrincipal Actor a) {
    return people.preferences(a);
  }

  public record Preferences(
      boolean privateAccount,
      boolean recommendations,
      boolean autoplay,
      @NotNull @Size(max = 20) List<@NotBlank @Size(max = 40) String> interests,
      boolean automatic,
      @NotNull @Size(min = 3, max = 3) List<String> order) {}

  @PutMapping("/preferences")
  public Object preferences(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody Preferences body) {
    return people.preferences(
        a,
        body.privateAccount(),
        body.recommendations(),
        body.autoplay(),
        body.interests(),
        body.automatic(),
        body.order());
  }
}
