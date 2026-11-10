package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.NotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SocialReview {
  private final Db db; private final SocialAccess access; private final NotificationService notices;
  public SocialReview(Db db,SocialAccess access,NotificationService notices) { this.db=db;this.access=access;this.notices=notices; }
  public record Reason(@NotBlank @Size(max=1500) String reason) {}
  public record Decision(@NotBlank @Pattern(regexp="APPROVED|REJECTED|REVOKED|DISMISSED|REMOVED") String status,@NotBlank @Size(max=1500) String reason) {}
  @PostMapping("/social/posts/{id}/report")
  public Object report(@AuthenticationPrincipal Actor a,@PathVariable UUID id,@Valid @RequestBody Reason body) {
    access.post(a,id);
    db.jdbc.update("INSERT INTO social_report(id,reporter_id,post_id,reason) VALUES (?,?,?,?) ON CONFLICT(reporter_id,post_id) DO NOTHING",UUID.randomUUID(),a.id(),id,body.reason());
    return Map.of("reported",true);
  }
  @GetMapping("/social/verification")
  public Object mine(@AuthenticationPrincipal Actor a) {
    access.require();
    long followers=db.jdbc.queryForObject("SELECT count(*) FROM social_follow f JOIN app_user u ON u.id=f.follower_id WHERE f.followed_id=? AND f.status='ACCEPTED' AND u.status='ACTIVE'",Long.class,a.id());
    return Map.of("eligibleForReview",followers>=100000,"items",db.list("SELECT id,reason,status,decision,created_at,reviewed_at FROM social_verification WHERE user_id=? ORDER BY created_at DESC LIMIT 20",a.id()));
  }
  @PostMapping("/social/verification") @Transactional
  public Object request(@AuthenticationPrincipal Actor a,@Valid @RequestBody Reason body) {
    access.profile(a.id());
    db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE",a.id());
    var pending=db.list("SELECT id FROM social_verification WHERE user_id=? AND status='PENDING'",a.id());
    if(!pending.isEmpty()) return pending.getFirst();
    if(db.exists("SELECT EXISTS(SELECT 1 FROM social_profile WHERE user_id=? AND verified)",a.id())) throw ApiException.invalid("Sua conta já está verificada.");
    if(db.exists("SELECT EXISTS(SELECT 1 FROM social_verification WHERE user_id=? AND created_at>now()-interval '7 days')",a.id())) throw new ApiException(429,"VERIFICATION_COOLDOWN","Aguarde sete dias entre solicitações ou recursos.");
    UUID id=UUID.randomUUID();
    db.jdbc.update("INSERT INTO social_verification(id,user_id,reason) VALUES (?,?,?)",id,a.id(),body.reason());
    notices.send(null,a.id(),"SOCIAL_VERIFICATION_RECEIVED","social:verification",id,"/social?settings=verification","Sua solicitação foi recebida para análise.");
    return Map.of("id",id,"status","PENDING");
  }
  @GetMapping("/admin/social/review")
  public Object queue(@AuthenticationPrincipal Actor a,@RequestParam(defaultValue="verification") String kind,@RequestParam(defaultValue="0") int page) {
    admin(a);
    if(kind.equals("verification")) return db.list("SELECT v.id,v.user_id,v.reason,v.status,v.decision,v.created_at,u.name,u.username,(SELECT count(*) FROM social_follow f JOIN app_user fu ON fu.id=f.follower_id WHERE f.followed_id=v.user_id AND f.status='ACCEPTED' AND fu.status='ACTIVE') followers FROM social_verification v JOIN app_user u ON u.id=v.user_id ORDER BY (v.status='PENDING') DESC,v.created_at DESC LIMIT 30 OFFSET ?",Db.offset(page));
    if(kind.equals("reports")) return db.list("SELECT r.id,r.post_id,r.reason,r.status,r.created_at,p.author_id,p.body FROM social_report r JOIN social_post p ON p.id=r.post_id ORDER BY (r.status='OPEN') DESC,r.created_at DESC LIMIT 30 OFFSET ?",Db.offset(page));
    throw ApiException.invalid("Fila inválida.");
  }
  @PostMapping("/admin/social/verification/{id}") @Transactional
  public Object decide(@AuthenticationPrincipal Actor a,@PathVariable UUID id,@Valid @RequestBody Decision body) {
    admin(a);
    if(!Set.of("APPROVED","REJECTED","REVOKED").contains(body.status())) throw ApiException.invalid("Decisão inválida.");
    var item=db.one("SELECT * FROM social_verification WHERE id=? FOR UPDATE",id);
    if(a.id().equals(item.get("userId"))) throw ApiException.forbidden();
    String prior=(String)item.get("status");
    if(prior.equals(body.status())) return Map.of("status",prior);
    if(!(prior.equals("PENDING") && !body.status().equals("REVOKED")) && !(prior.equals("APPROVED") && body.status().equals("REVOKED"))) throw ApiException.invalid("Esta solicitação já foi decidida.");
    db.jdbc.update("UPDATE social_verification SET status=?,decision=?,reviewer_id=?,reviewed_at=now() WHERE id=?",body.status(),body.reason(),a.id(),id);
    db.jdbc.update("UPDATE social_profile SET verified=? WHERE user_id=?",body.status().equals("APPROVED"),item.get("userId"));
    audit(a,id,"SOCIAL_VERIFICATION",prior,body.status(),body.reason());
    notices.send(a.id(),(UUID)item.get("userId"),"SOCIAL_VERIFICATION_"+body.status(),"social:verification",id,"/social?settings=verification","Sua solicitação de verificação social foi atualizada.");
    return Map.of("status",body.status());
  }
  @PostMapping("/admin/social/reports/{id}") @Transactional
  public Object reviewReport(@AuthenticationPrincipal Actor a,@PathVariable UUID id,@Valid @RequestBody Decision body) {
    admin(a);
    if(!Set.of("DISMISSED","REMOVED").contains(body.status())) throw ApiException.invalid("Decisão inválida.");
    var item=db.one("SELECT * FROM social_report WHERE id=? FOR UPDATE",id);
    if(!"OPEN".equals(item.get("status"))) return Map.of("status",item.get("status"));
    db.jdbc.update("UPDATE social_report SET status=?,decision=?,reviewed_by=? WHERE id=?",body.status(),body.reason(),a.id(),id);
    if(body.status().equals("REMOVED")) {
      db.jdbc.update("UPDATE social_post SET state='REMOVED',updated_at=now() WHERE id=?",item.get("postId"));
      db.jdbc.update("UPDATE social_media SET state='DELETING' WHERE post_id=?",item.get("postId"));
    }
    audit(a,id,"SOCIAL_REPORT","OPEN",body.status(),body.reason());
    return Map.of("status",body.status());
  }
  private void admin(Actor a) { access.require(); if(!a.admin()) throw ApiException.forbidden(); }
  private void audit(Actor a,UUID id,String action,String before,String after,String reason) {
    db.jdbc.update("INSERT INTO audit_log(id,actor_id,action,resource_id,before_value,after_value) VALUES (?,?,?,?,jsonb_build_object('status',?::text),jsonb_build_object('status',?::text,'reason',?::text))",UUID.randomUUID(),a.id(),action,id,before,after,reason);
  }
}
