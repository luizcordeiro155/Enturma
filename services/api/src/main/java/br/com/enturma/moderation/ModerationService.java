package br.com.enturma.moderation;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModerationService {
  private final Db db;

  public ModerationService(Db db) {
    this.db = db;
  }

  @Transactional
  public void block(Actor a, UUID target) {
    if (a.id().equals(target))
      throw ApiException.invalid("Não é possível bloquear sua própria conta.");
    db.jdbc.update("INSERT INTO user_block VALUES (?,?) ON CONFLICT DO NOTHING", a.id(), target);
    db.jdbc.update(
        "DELETE FROM ride_live_location WHERE match_id IN (SELECT id FROM ride_match WHERE"
            + " (driver_id=? AND passenger_id=?) OR (driver_id=? AND passenger_id=?))",
        a.id(),
        target,
        target,
        a.id());
    db.jdbc.update(
        "UPDATE ride_safety_share SET revoked_at=coalesce(revoked_at,now()) WHERE match_id IN"
            + " (SELECT id FROM ride_match WHERE (driver_id=? AND passenger_id=?) OR"
            + " (driver_id=? AND passenger_id=?)) AND revoked_at IS NULL",
        a.id(),
        target,
        target,
        a.id());
  }

  public void unblock(Actor a, UUID target) {
    db.jdbc.update("DELETE FROM user_block WHERE user_id=? AND blocked_id=?", a.id(), target);
  }

  public Object blocks(Actor a) {
    return db.list(
        "SELECT u.id,u.name FROM user_block b JOIN app_user u ON u.id=b.blocked_id WHERE"
            + " b.user_id=? LIMIT 100",
        a.id());
  }

  public void report(Actor a, UUID target, String reason) {
    db.jdbc.update(
        "INSERT INTO report(id,reporter_id,target_id,reason) VALUES (?,?,?,?)",
        UUID.randomUUID(),
        a.id(),
        target,
        reason);
  }

  public Object notifications(Actor a) {
    return db.list(
        "SELECT id,message,read_at,created_at FROM notification WHERE user_id=? ORDER BY created_at"
            + " DESC LIMIT 50",
        a.id());
  }

  public void read(Actor a, UUID id) {
    db.jdbc.update("UPDATE notification SET read_at=now() WHERE id=? AND user_id=?", id, a.id());
  }

  @Transactional
  public void status(Actor a, UUID target, String status) {
    if (!a.admin() || a.id().equals(target)) throw ApiException.forbidden();
    if (!Set.of("ACTIVE", "SUSPENDED", "BANNED").contains(status))
      throw ApiException.invalid("Status inválido.");
    var prior = db.one("SELECT status,role FROM app_user WHERE id=? FOR UPDATE", target);
    if (!prior.get("role").equals("USER") && !a.role().equals("SUPER_ADMIN"))
      throw ApiException.forbidden();
    db.jdbc.update("UPDATE app_user SET status=? WHERE id=?", status, target);
    db.jdbc.update("UPDATE user_session SET revoked_at=now() WHERE user_id=?", target);
    db.jdbc.update(
        "INSERT INTO audit_log(id,actor_id,action,resource_id,before_value,after_value) VALUES"
            + " (?,?,'USER_STATUS',?,jsonb_build_object('status',?::text),jsonb_build_object('status',?::text))",
        UUID.randomUUID(),
        a.id(),
        target,
        prior.get("status"),
        status);
  }
}
