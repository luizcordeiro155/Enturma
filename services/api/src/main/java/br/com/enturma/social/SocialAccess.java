package br.com.enturma.social;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SocialAccess {
  private final Db db;
  private final boolean enabled;
  public SocialAccess(Db db, @Value("${SOCIAL_ENABLED:false}") boolean enabled) {
    this.db = db; this.enabled = enabled;
  }
  public boolean enabled() { return enabled; }
  public void require() { if (!enabled) throw ApiException.missing(); }
  public void profile(UUID user) {
    require();
    db.one("SELECT id FROM app_user WHERE id=? AND status='ACTIVE'", user);
    db.jdbc.update("INSERT INTO social_profile(user_id) VALUES (?) ON CONFLICT DO NOTHING", user);
  }
  public void unblocked(UUID viewer, UUID creator) {
    require();
    db.one("SELECT id FROM app_user WHERE id=? AND status='ACTIVE'", creator);
    if (db.exists("SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR (user_id=? AND blocked_id=?))", viewer, creator, creator, viewer))
      throw ApiException.missing();
  }
  /** Correlated SQL receives viewer id four times. All consumers share this visibility rule. */
  public static String visible(String alias) {
    return " EXISTS(SELECT 1 FROM app_user su WHERE su.id="+alias+".author_id AND su.status='ACTIVE')"
      + " AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND b.blocked_id="+alias+".author_id) OR (b.blocked_id=? AND b.user_id="+alias+".author_id))"
      + " AND ("+alias+".author_id=? OR (("+alias+".visibility='PUBLIC' AND NOT EXISTS(SELECT 1 FROM social_profile sp WHERE sp.user_id="+alias+".author_id AND sp.private_account))"
      + " OR EXISTS(SELECT 1 FROM social_follow f WHERE f.follower_id=? AND f.followed_id="+alias+".author_id AND f.status='ACCEPTED')))";
  }
  public static String published(String alias) {
    return alias+".state='PUBLISHED' AND ("+alias+".expires_at IS NULL OR "+alias+".expires_at>now() OR EXISTS(SELECT 1 FROM social_highlight h WHERE h.post_id="+alias+".id))";
  }
  public Map<String,Object> post(Actor actor, UUID id) {
    require();
    return db.one("SELECT p.* FROM social_post p WHERE p.id=? AND "+published("p")+" AND "+visible("p"), id,actor.id(),actor.id(),actor.id(),actor.id());
  }
  public boolean mayView(Actor actor, UUID id) {
    try { post(actor,id); return true; } catch(ApiException ignored) { return false; }
  }
  public void owner(Actor actor, UUID id) {
    require();
    db.one("SELECT id FROM social_post WHERE id=? AND author_id=? AND state<>'REMOVED' FOR UPDATE",id,actor.id());
  }
}
