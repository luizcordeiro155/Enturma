package br.com.enturma.auth;

import br.com.enturma.common.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Explicit projections: never export session secrets, hashes or another student's data. */
@RestController
@RequestMapping("/api/v1/account/privacy/export")
public class PersonalDataExport {
  private final Db db;
  public PersonalDataExport(Db db) { this.db=db; }
  private static final Map<String,String> SECTIONS=new LinkedHashMap<>(Map.of(
    "account", "SELECT id,name,username,email,bio,profile_details,created_at FROM app_user WHERE id=? ORDER BY id",
    "portfolio", "SELECT headline,summary,skills,projects,public,updated_at FROM portfolio_profile WHERE user_id=? ORDER BY user_id",
    "notebooks", "SELECT id,title,created_at,updated_at FROM study_notebook WHERE user_id=? ORDER BY created_at,id",
    "sources", "SELECT s.id,s.notebook_id,s.title,s.kind,s.url,s.content,s.created_at FROM notebook_source s JOIN study_notebook n ON n.id=s.notebook_id WHERE n.user_id=? ORDER BY s.created_at,s.id",
    "conversations", "SELECT g.id,g.notebook_id,g.question,g.answer,g.citations,g.external_sources,g.created_at FROM notebook_generation g JOIN study_notebook n ON n.id=g.notebook_id WHERE n.user_id=? ORDER BY g.created_at,g.id",
    "media", "SELECT id,name,kind,favorite,created_at FROM chat_media WHERE user_id=? ORDER BY created_at,id",
    "attachments", "SELECT id,name,mime,created_at FROM portfolio_attachment WHERE user_id=? ORDER BY created_at,id",
    "social-posts", "SELECT id,kind,body,visibility,state,tags,project_url,story_overlays,published_at,created_at FROM social_post WHERE author_id=? ORDER BY created_at,id",
    "social-interactions", "SELECT post_id,kind,created_at FROM social_reaction WHERE user_id=? ORDER BY created_at,post_id,kind",
    "social-preferences", "SELECT private_account,recommendations,autoplay,interests,navigation FROM social_profile WHERE user_id=? ORDER BY user_id"
  ));
  static {
    SECTIONS.put("social-collections", "SELECT id,name,created_at FROM social_collection WHERE owner_id=? ORDER BY created_at,id");
    SECTIONS.put("social-collection-items", "SELECT i.collection_id,i.post_id,i.created_at FROM social_collection_item i JOIN social_collection c ON c.id=i.collection_id WHERE c.owner_id=? ORDER BY i.created_at,i.collection_id,i.post_id");
    SECTIONS.put("social-lives", "SELECT id,title,visibility,state,started_at,ended_at,peak_viewers FROM social_live WHERE author_id=? ORDER BY started_at,id");
    SECTIONS.put("social-comment-likes", "SELECT comment_id,created_at FROM social_comment_like WHERE user_id=? ORDER BY created_at,comment_id");
    SECTIONS.put("social-comment-media", "SELECT id,post_id,mime,octet_length(data) size,created_at FROM social_comment_media WHERE owner_id=? ORDER BY created_at,id");
    SECTIONS.put("social-comments", "SELECT id,post_id,parent_id,body,deleted,created_at FROM social_comment WHERE author_id=? ORDER BY created_at,id");
    SECTIONS.put("social-following", "SELECT followed_id,status,notify,created_at FROM social_follow WHERE follower_id=? ORDER BY created_at,followed_id");
    SECTIONS.put("social-followers", "SELECT follower_id,status,created_at FROM social_follow WHERE followed_id=? ORDER BY created_at,follower_id");
    SECTIONS.put("social-feedback", "SELECT post_id,watched_ms,completed,updated_at FROM social_feedback WHERE user_id=? ORDER BY updated_at,post_id");
    SECTIONS.put("social-mutes", "SELECT creator_id FROM social_mute WHERE user_id=? ORDER BY creator_id");
    SECTIONS.put("social-verification", "SELECT id,reason,status,decision,created_at,reviewed_at FROM social_verification WHERE user_id=? ORDER BY created_at,id");
    SECTIONS.put("social-reports", "SELECT id,post_id,reason,status,created_at FROM social_report WHERE reporter_id=? ORDER BY created_at,id");
  }
  @GetMapping
  public ResponseEntity<?> export(@AuthenticationPrincipal Actor actor,
      @RequestParam(defaultValue="account") String section,@RequestParam(defaultValue="0") int offset) {
    String query=SECTIONS.get(section);
    if(query==null || offset<0 || offset>100000) throw ApiException.invalid("Página de exportação inválida.");
    var rows=db.list(query+" LIMIT 101 OFFSET ?",actor.id(),offset);
    return ResponseEntity.ok().header("Cache-Control","private,no-store")
      .body(Map.of("section",section,"items",rows.subList(0,Math.min(100,rows.size())),"nextOffset",rows.size()>100?offset+100:-1));
  }
}
