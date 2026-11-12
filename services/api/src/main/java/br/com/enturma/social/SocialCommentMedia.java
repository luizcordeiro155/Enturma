package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.RoomMediaController;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.util.*;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Small private comment attachments reuse the chat's bounded image format policy. */
@RestController
@RequestMapping("/api/v1/social/posts/{post}")
public class SocialCommentMedia {
  private final Db db;
  private final SocialAccess access;
  public SocialCommentMedia(Db db, SocialAccess access) { this.db=db;this.access=access; }

  @PostMapping(value="/comment-media", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
  @Transactional
  public Map<String,Object> upload(@AuthenticationPrincipal Actor actor, @PathVariable UUID post,
      @RequestParam MultipartFile file) throws IOException {
    access.post(actor,post);
    if (file.isEmpty() || file.getSize()>1400*1024)
      throw ApiException.invalid("Use uma imagem ou GIF de at\u00e9 1,4 MB.");
    byte[] bytes=file.getBytes();
    String mime=List.of("image/jpeg","image/png","image/gif","image/webp").stream()
        .filter(type->RoomMediaController.validImage(type,bytes)).findFirst()
        .orElseThrow(()->ApiException.invalid("Use JPG, PNG, WebP ou GIF."));
    db.one("SELECT id FROM app_user WHERE id=? AND status='ACTIVE' FOR UPDATE",actor.id());
    long pending=db.jdbc.queryForObject("SELECT coalesce(sum(octet_length(data)),0) FROM social_comment_media m WHERE owner_id=? AND NOT EXISTS(SELECT 1 FROM social_comment c WHERE c.media_id=m.id)",Long.class,actor.id());
    if (pending+bytes.length>16*1024*1024)
      throw ApiException.invalid("Conclua ou remova os anexos pendentes antes de enviar mais.");
    UUID id=UUID.randomUUID();
    db.jdbc.update("INSERT INTO social_comment_media(id,post_id,owner_id,mime,data) VALUES(?,?,?,?,?)",id,post,actor.id(),mime,bytes);
    return Map.of("id",id,"mime",mime);
  }

  private Map<String,Object> comment(Actor actor,UUID post,UUID id) {
    access.post(actor,post);
    var row=db.one("SELECT c.* FROM social_comment c JOIN app_user u ON u.id=c.author_id AND u.status='ACTIVE' WHERE c.id=? AND c.post_id=? AND NOT c.deleted",id,post);
    access.unblocked(actor.id(),(UUID)row.get("authorId"));
    return row;
  }

  @GetMapping("/comments/{id}/media")
  public ResponseEntity<byte[]> file(@AuthenticationPrincipal Actor actor,@PathVariable UUID post,@PathVariable UUID id) {
    var row=comment(actor,post,id);
    var media=db.one("SELECT data,mime FROM social_comment_media WHERE id=? AND post_id=?",row.get("mediaId"),post);
    return ResponseEntity.ok().contentType(MediaType.parseMediaType((String)media.get("mime")))
        .header("Cache-Control","private,no-store").header("X-Content-Type-Options","nosniff")
        .header("Content-Security-Policy","sandbox").body((byte[])media.get("data"));
  }

  @DeleteMapping("/comment-media/{id}")
  @Transactional
  public void discard(@AuthenticationPrincipal Actor actor,@PathVariable UUID post,@PathVariable UUID id) {
    access.require();
    db.jdbc.update("DELETE FROM social_comment_media m WHERE id=? AND post_id=? AND owner_id=? AND NOT EXISTS(SELECT 1 FROM social_comment c WHERE c.media_id=m.id)",id,post,actor.id());
  }

  public record Like(@NotNull Boolean active) {}
  @PutMapping("/comments/{id}/like")
  @Transactional
  public Map<String,Object> like(@AuthenticationPrincipal Actor actor,@PathVariable UUID post,@PathVariable UUID id,@Valid @RequestBody Like input) {
    comment(actor,post,id);
    if(Boolean.TRUE.equals(input.active())) db.jdbc.update("INSERT INTO social_comment_like(comment_id,user_id) VALUES(?,?) ON CONFLICT DO NOTHING",id,actor.id());
    else db.jdbc.update("DELETE FROM social_comment_like WHERE comment_id=? AND user_id=?",id,actor.id());
    return Map.of("likes",db.jdbc.queryForObject("SELECT count(*) FROM social_comment_like WHERE comment_id=?",Long.class,id),"liked",Boolean.TRUE.equals(input.active()));
  }

  @Scheduled(fixedDelay=3600000)
  @Transactional
  public void retention() {
    db.jdbc.update("DELETE FROM social_comment_media m WHERE (created_at<now()-interval '24 hours' AND NOT EXISTS(SELECT 1 FROM social_comment c WHERE c.media_id=m.id AND NOT c.deleted)) OR EXISTS(SELECT 1 FROM social_post p WHERE p.id=m.post_id AND p.state='REMOVED')");
  }
}
