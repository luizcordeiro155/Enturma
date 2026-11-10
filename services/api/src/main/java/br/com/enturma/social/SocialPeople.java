package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.NotificationService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialPeople {
  private final Db db;
  private final SocialAccess access;
  private final NotificationService notices;
  public SocialPeople(Db db, SocialAccess access, NotificationService notices) {
    this.db=db; this.access=access; this.notices=notices;
  }
  private void pair(Actor a,UUID other) {
    access.unblocked(a.id(),other);
    if(a.id().equals(other)) throw ApiException.invalid("Escolha outro estudante.");
    access.profile(other); access.profile(a.id());
    db.list("SELECT user_id FROM social_profile WHERE user_id IN (?,?) ORDER BY user_id FOR UPDATE",a.id(),other);
  }
  @Transactional
  public Object follow(Actor a, UUID other, boolean following) {
    pair(a,other);
    if(!following) db.jdbc.update("DELETE FROM social_follow WHERE follower_id=? AND followed_id=?",a.id(),other);
    else {
      boolean privateAccount=(boolean)db.one("SELECT private_account FROM social_profile WHERE user_id=?",other).get("privateAccount");
      int inserted=db.jdbc.update("INSERT INTO social_follow(follower_id,followed_id,status) VALUES (?,?,?) ON CONFLICT DO NOTHING",a.id(),other,privateAccount?"PENDING":"ACCEPTED");
      if(inserted>0) notices.send(a.id(),other,privateAccount?"SOCIAL_FOLLOW_REQUEST":"SOCIAL_FOLLOW","social:relationship",a.id(),"/social?person="+a.id(),privateAccount?"Um estudante pediu para seguir você.":"Um estudante começou a seguir você.");
    }
    return relationship(a,other);
  }
  public Object relationship(Actor a,UUID other) {
    access.unblocked(a.id(),other);
    return db.one("SELECT coalesce((SELECT status FROM social_follow WHERE follower_id=? AND followed_id=?),'NONE') status, EXISTS(SELECT 1 FROM social_follow WHERE follower_id=? AND followed_id=? AND status='ACCEPTED') follows_you, EXISTS(SELECT 1 FROM social_mute WHERE user_id=? AND creator_id=?) muted",a.id(),other,other,a.id(),a.id(),other);
  }
  public void notify(Actor a,UUID creator,boolean active) {
    access.unblocked(a.id(),creator);
    db.jdbc.update("UPDATE social_follow SET notify=? WHERE follower_id=? AND followed_id=? AND status='ACCEPTED'",active,a.id(),creator);
  }
  @Transactional
  public Object decide(Actor a,UUID follower,boolean accept) {
    pair(a,follower);
    if(accept) {
      int changed=db.jdbc.update("UPDATE social_follow SET status='ACCEPTED' WHERE follower_id=? AND followed_id=? AND status='PENDING'",follower,a.id());
      if(changed>0) notices.send(a.id(),follower,"SOCIAL_FOLLOW_ACCEPTED","social:relationship",a.id(),"/social?person="+a.id(),"Sua solicitação para seguir foi aceita.");
    } else db.jdbc.update("DELETE FROM social_follow WHERE follower_id=? AND followed_id=?",follower,a.id());
    return Map.of("accepted",accept);
  }
  @Transactional
  public void mute(Actor a,UUID other,boolean muted) {
    pair(a,other);
    if(muted) db.jdbc.update("INSERT INTO social_mute(user_id,creator_id) VALUES (?,?) ON CONFLICT DO NOTHING",a.id(),other);
    else db.jdbc.update("DELETE FROM social_mute WHERE user_id=? AND creator_id=?",a.id(),other);
  }
  public Object search(Actor a,String query) {
    access.require();
    if(query.length()>80) throw ApiException.invalid("Busca muito longa.");
    if(query.strip().length()<2) return List.of();
    return db.list("SELECT u.id,u.name,u.username,u.avatar_bytes IS NOT NULL has_avatar,coalesce(s.verified,false) verified FROM app_user u LEFT JOIN social_profile s ON s.user_id=u.id WHERE u.status='ACTIVE' AND (u.username ILIKE ? OR u.name ILIKE ?) AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND b.blocked_id=u.id) OR (b.blocked_id=? AND b.user_id=u.id)) ORDER BY u.username,u.id LIMIT 30", "%"+query.strip()+"%","%"+query.strip()+"%",a.id(),a.id());
  }
  public Object connections(Actor a,UUID user,String kind,int page) {
    access.unblocked(a.id(),user);
    if(!Set.of("followers","following","requests").contains(kind)) throw ApiException.invalid("Lista inválida.");
    boolean requests=kind.equals("requests");
    if(requests && !user.equals(a.id())) throw ApiException.forbidden();
    if(!user.equals(a.id()) && db.exists("SELECT EXISTS(SELECT 1 FROM social_profile WHERE user_id=? AND private_account) AND NOT EXISTS(SELECT 1 FROM social_follow WHERE follower_id=? AND followed_id=? AND status='ACCEPTED')",user,a.id(),user)) throw ApiException.forbidden();
    String person=kind.equals("following")?"f.followed_id":"f.follower_id";
    String subject=kind.equals("following")?"f.follower_id":"f.followed_id";
    return db.list("SELECT u.id,u.name,u.username,u.avatar_bytes IS NOT NULL has_avatar,coalesce(s.verified,false) verified FROM social_follow f JOIN app_user u ON u.id="+person+" LEFT JOIN social_profile s ON s.user_id=u.id WHERE "+subject+"=? AND f.status=? AND u.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND b.blocked_id=u.id) OR (b.blocked_id=? AND b.user_id=u.id)) ORDER BY f.created_at DESC,u.id LIMIT 30 OFFSET ?",user,requests?"PENDING":"ACCEPTED",a.id(),a.id(),Db.offset(page));
  }
  public Object profile(Actor a, UUID user) {
    access.unblocked(a.id(),user);
    var row=db.one("SELECT u.id,u.name,u.username,u.avatar_bytes IS NOT NULL has_avatar,u.banner_bytes IS NOT NULL has_banner,coalesce(s.private_account,false) private_account,coalesce(s.verified,false) verified,(SELECT count(*) FROM social_follow f JOIN app_user fuser ON fuser.id=f.follower_id WHERE f.followed_id=u.id AND f.status='ACCEPTED' AND fuser.status='ACTIVE') followers,(SELECT count(*) FROM social_follow f JOIN app_user fuser ON fuser.id=f.followed_id WHERE f.follower_id=u.id AND f.status='ACCEPTED' AND fuser.status='ACTIVE') following FROM app_user u LEFT JOIN social_profile s ON s.user_id=u.id WHERE u.id=?",user);
    row.put("relationship",relationship(a,user));
    row.putAll(db.one("SELECT count(*) posts,coalesce(sum((SELECT count(*) FROM social_reaction r WHERE r.post_id=p.id AND r.kind='LIKE')),0) likes_received FROM social_post p WHERE p.author_id=? AND p.kind<>'STORY' AND "+SocialAccess.published("p")+" AND "+SocialAccess.visible("p"),user,a.id(),a.id(),a.id(),a.id()));
    return row;
  }
  public Object preferences(Actor a) {
    access.profile(a.id());
    return db.one("SELECT private_account,recommendations,autoplay,interests,navigation FROM social_profile WHERE user_id=?",a.id());
  }
  @Transactional
  public Object preferences(Actor a,boolean privateAccount,boolean recommendations,boolean autoplay,List<String> interests,boolean automatic,List<String> order) {
    access.profile(a.id());
    if(interests==null || interests.size()>20 || order==null || order.size()!=3 || !new HashSet<>(order).equals(Set.of("feed","clips","create"))) throw ApiException.invalid("Preferências inválidas.");
    var tags=SocialPosts.tags(String.join(" ",interests.stream().map(t->"#"+t).toList()));
    db.one("SELECT user_id FROM social_profile WHERE user_id=? FOR UPDATE",a.id());
    String navigation="{\"automatic\":"+automatic+",\"order\":["+String.join(",",order.stream().map(s->"\""+s+"\"").toList())+"]}";
    db.jdbc.update("UPDATE social_profile SET private_account=?,recommendations=?,autoplay=?,interests=?::text[],navigation=?::jsonb,updated_at=now() WHERE user_id=?",privateAccount,recommendations,autoplay,"{"+String.join(",",tags)+"}",navigation,a.id());
    if(!recommendations) db.jdbc.update("DELETE FROM social_feedback WHERE user_id=?",a.id());
    // Existing pending requests remain explicit decisions, including when changing privacy.
    return preferences(a);
  }
}
