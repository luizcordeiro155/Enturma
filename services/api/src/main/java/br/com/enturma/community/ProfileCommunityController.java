package br.com.enturma.community;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ProfileCommunityController {
  private final Db db;

  public ProfileCommunityController(Db db) {
    this.db = db;
  }

  public record Activity(@NotNull @Pattern(regexp = "GAME|PRACTICE|NOTEBOOK|ROOM") String kind) {}

  @PostMapping("/users/me/activity")
  @Transactional
  public void activity(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Activity value) {
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", actor.id());
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM profile_privacy_setting WHERE user_id=? AND field='ACTIVITY'"
            + " AND visible)",
        actor.id())) return;
    db.jdbc.update(
        "UPDATE profile_activity SET ended_at=last_seen_at WHERE user_id=? AND session_id=? AND"
            + " ended_at IS NULL AND (kind<>? OR last_seen_at<now()-interval '90 seconds')",
        actor.id(),
        actor.sessionId(),
        value.kind());
    if (db.jdbc.update(
            "UPDATE profile_activity SET last_seen_at=now() WHERE user_id=? AND session_id=? AND"
                + " ended_at IS NULL",
            actor.id(),
            actor.sessionId())
        == 0)
      db.jdbc.update(
          "INSERT INTO profile_activity(id,user_id,session_id,kind) VALUES (?,?,?,?)",
          UUID.randomUUID(),
          actor.id(),
          actor.sessionId(),
          value.kind());
  }

  @DeleteMapping("/users/me/activity")
  public void stop(@AuthenticationPrincipal Actor actor, @RequestParam String kind) {
    db.jdbc.update(
        "UPDATE profile_activity SET ended_at=now() WHERE user_id=? AND session_id=? AND kind=? AND"
            + " ended_at IS NULL",
        actor.id(),
        actor.sessionId(),
        kind);
  }

  @GetMapping("/users/{id}/community")
  public Object community(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    db.one("SELECT id FROM app_user WHERE id=? AND status='ACTIVE'", id);
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR (user_id=?"
            + " AND blocked_id=?))",
        actor.id(),
        id,
        id,
        actor.id())) throw ApiException.forbidden();
    var result = new LinkedHashMap<String, Object>();
    result.put(
        "rooms",
        db.list(
            "SELECT r.id,r.title,r.status,r.has_avatar,r.has_banner,r.media_version FROM study_room"
                + " r JOIN room_participant mine ON mine.room_id=r.id AND mine.user_id=? AND NOT"
                + " mine.removed JOIN room_participant theirs ON theirs.room_id=r.id AND"
                + " theirs.user_id=? AND NOT theirs.removed WHERE (mine.left_at IS NULL OR"
                + " r.status='ENDED') AND (theirs.left_at IS NULL OR r.status='ENDED') ORDER BY"
                + " r.created_at DESC LIMIT 20",
            actor.id(),
            id));
    result.put(
        "friends",
        db.list(
            "SELECT u.id,u.name,u.username,u.has_avatar FROM (SELECT id,name,username,avatar_bytes"
                + " IS NOT NULL has_avatar FROM app_user WHERE status='ACTIVE') u JOIN friendship"
                + " mine ON (mine.requester=? AND mine.recipient=u.id OR mine.recipient=? AND"
                + " mine.requester=u.id) AND mine.status='ACCEPTED' JOIN friendship theirs ON"
                + " (theirs.requester=? AND theirs.recipient=u.id OR theirs.recipient=? AND"
                + " theirs.requester=u.id) AND theirs.status='ACCEPTED' WHERE u.id NOT IN (?,?) AND"
                + " NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id IN (?,?) AND"
                + " b.blocked_id=u.id) OR (b.blocked_id IN (?,?) AND b.user_id=u.id)) ORDER BY"
                + " u.name LIMIT 30",
            actor.id(),
            actor.id(),
            id,
            id,
            actor.id(),
            id,
            actor.id(),
            id,
            actor.id(),
            id));
    boolean visible =
        actor.id().equals(id)
            || db.exists(
                "SELECT EXISTS(SELECT 1 FROM profile_privacy_setting WHERE user_id=? AND"
                    + " field='ACTIVITY' AND visible)",
                id);
    result.put("activityVisible", visible);
    if (visible)
      result.put(
          "activity",
          db.list(
              "SELECT a.id,CASE WHEN a.kind='ROOM' AND a.ended_at IS NULL AND"
                  + " a.last_seen_at>now()-interval '90 seconds' AND EXISTS(SELECT 1 FROM"
                  + " room_voice_presence v JOIN room_participant p ON p.room_id=v.room_id AND"
                  + " p.user_id=v.user_id AND p.left_at IS NULL AND NOT p.removed WHERE"
                  + " v.user_id=a.user_id AND v.connected AND v.updated_at>now()-interval '50"
                  + " seconds') THEN 'ROOM_CALL' ELSE a.kind END"
                  + " kind,a.started_at,a.last_seen_at,a.ended_at,(a.ended_at IS NULL AND"
                  + " a.last_seen_at>now()-interval '90 seconds' AND s.revoked_at IS NULL) active"
                  + " FROM profile_activity a JOIN user_session s ON s.id=a.session_id WHERE"
                  + " a.user_id=? AND a.last_seen_at>now()-interval '7 days' ORDER BY"
                  + " a.last_seen_at DESC LIMIT 15",
              id));
    return result;
  }

  @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 3600000)
  public void clean() {
    db.jdbc.update("DELETE FROM profile_activity WHERE last_seen_at<now()-interval '7 days'");
  }
}
