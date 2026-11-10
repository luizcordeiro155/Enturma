package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import br.com.enturma.notifications.NotificationService;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialMaintenance {
  private final Db db;
  private final SocialAccess access;
  private final NotificationService notices;
  public SocialMaintenance(Db db,SocialAccess access,NotificationService notices) { this.db=db;this.access=access;this.notices=notices; }
  @Scheduled(fixedDelay=3000) @Transactional
  public void fanout() {
    if(!access.enabled()) return;
    var jobs=db.list("SELECT f.post_id,f.after_user,p.author_id,p.published_at FROM social_fanout f JOIN social_post p ON p.id=f.post_id ORDER BY f.created_at LIMIT 1 FOR UPDATE OF f SKIP LOCKED");
    if(jobs.isEmpty()) return;
    var job=jobs.getFirst(); UUID id=(UUID)job.get("postId"), author=(UUID)job.get("authorId");
    var followers=db.list("SELECT follower_id FROM social_follow WHERE followed_id=? AND status='ACCEPTED' AND notify AND follower_id>? AND created_at<=?::timestamptz ORDER BY follower_id LIMIT 100",author,job.get("afterUser"),job.get("publishedAt"));
    for(var f:followers) {
      UUID user=(UUID)f.get("followerId");
      if(access.mayView(new Actor(user,null,"USER"),id)) notices.send(author,user,"SOCIAL_CONTENT","social:content",id,"/social?post="+id,"Um criador que você acompanha publicou no Enturma.");
    }
    if(followers.size()<100) db.jdbc.update("DELETE FROM social_fanout WHERE post_id=?",id);
    else db.jdbc.update("UPDATE social_fanout SET after_user=? WHERE post_id=?",followers.getLast().get("followerId"),id);
  }
  @Scheduled(fixedDelay=3600000) @Transactional
  public void retention() {
    // Story access expires in every read query. Cleanup runs independently of the rollout flag.
    db.jdbc.update("DELETE FROM social_feedback WHERE updated_at<now()-interval '30 days'");
    db.jdbc.update("DELETE FROM social_story_view WHERE created_at<now()-interval '30 days'");
    db.jdbc.update("UPDATE social_media SET state='DELETING' WHERE (state IN ('UPLOADING','FAILED') AND updated_at<now()-interval '7 days') OR (post_id IS NULL AND state='READY' AND updated_at<now()-interval '7 days')");
    db.jdbc.update("UPDATE social_media m SET state='DELETING' FROM social_post p WHERE m.post_id=p.id AND p.kind='STORY' AND p.expires_at<now()-interval '30 days' AND NOT EXISTS(SELECT 1 FROM social_highlight h WHERE h.post_id=p.id)");
    db.jdbc.update("UPDATE social_post SET state='REMOVED',body='',tags='{}',project_url=NULL WHERE kind='STORY' AND expires_at<now()-interval '30 days' AND state='PUBLISHED' AND NOT EXISTS(SELECT 1 FROM social_highlight h WHERE h.post_id=social_post.id)");
  }
}
