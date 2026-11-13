package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Collections are private organization, never a grant to the referenced post. */
@RestController
@RequestMapping("/api/v1/social/collections")
public class SocialCollections {
  private final Db db;
  private final SocialAccess access;
  private final SocialPosts posts;

  public SocialCollections(Db db, SocialAccess access, SocialPosts posts) {
    this.db = db;
    this.access = access;
    this.posts = posts;
  }

  private void lock(Actor actor) {
    access.profile(actor.id());
    db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE", actor.id());
  }

  private void own(Actor actor, UUID id) {
    db.one("SELECT id FROM social_collection WHERE id=? AND owner_id=? FOR UPDATE", id, actor.id());
  }

  @GetMapping
  public Object list(
      @AuthenticationPrincipal Actor actor, @RequestParam(required = false) UUID post) {
    access.require();
    if (post != null) access.post(actor, post);
    return db.list(
        "SELECT c.id,c.name,EXISTS(SELECT 1 FROM social_collection_item i WHERE"
            + " i.collection_id=c.id AND i.post_id=?) selected FROM social_collection c WHERE"
            + " c.owner_id=? ORDER BY c.created_at,c.id",
        post,
        actor.id());
  }

  public record Name(@NotBlank @Size(max = 60) String name) {}

  @PutMapping("/{id}")
  @Transactional
  public Object save(
      @AuthenticationPrincipal Actor actor, @PathVariable UUID id, @Valid @RequestBody Name input) {
    lock(actor);
    if (input.name() == null || input.name().isBlank() || input.name().length() > 60)
      throw ApiException.invalid("Use um nome de até 60 caracteres.");
    if (!db.exists(
            "SELECT EXISTS(SELECT 1 FROM social_collection WHERE id=? AND owner_id=?)",
            id,
            actor.id())
        && db.jdbc.queryForObject(
                "SELECT count(*) FROM social_collection WHERE owner_id=?",
                Integer.class,
                actor.id())
            >= 50) throw ApiException.invalid("Você pode organizar até 50 coleções.");
    db.jdbc.update(
        "INSERT INTO social_collection(id,owner_id,name) VALUES (?,?,?) ON CONFLICT DO NOTHING",
        id,
        actor.id(),
        input.name().strip());
    own(actor, id);
    db.jdbc.update("UPDATE social_collection SET name=? WHERE id=?", input.name().strip(), id);
    return Map.of("id", id, "name", input.name().strip());
  }

  @DeleteMapping("/{id}")
  @Transactional
  public void remove(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    lock(actor);
    db.jdbc.update("DELETE FROM social_collection WHERE id=? AND owner_id=?", id, actor.id());
  }

  public record Membership(boolean active) {}

  @PutMapping("/{id}/posts/{post}")
  @Transactional
  public void member(
      @AuthenticationPrincipal Actor actor,
      @PathVariable UUID id,
      @PathVariable UUID post,
      @RequestBody Membership input) {
    lock(actor);
    own(actor, id);
    if (!input.active()) {
      db.jdbc.update(
          "DELETE FROM social_collection_item WHERE collection_id=? AND post_id=?", id, post);
      return;
    }
    access.post(actor, post);
    if (!db.exists(
            "SELECT EXISTS(SELECT 1 FROM social_collection_item WHERE collection_id=? AND"
                + " post_id=?)",
            id,
            post)
        && db.jdbc.queryForObject(
                "SELECT count(*) FROM social_collection_item WHERE collection_id=?",
                Integer.class,
                id)
            >= 5000)
      throw ApiException.invalid("Esta coleção atingiu o limite de 5.000 publicações.");
    posts.react(actor, post, "SAVE", true);
    db.jdbc.update(
        "INSERT INTO social_collection_item(collection_id,post_id) VALUES (?,?) ON CONFLICT DO"
            + " NOTHING",
        id,
        post);
  }
}
