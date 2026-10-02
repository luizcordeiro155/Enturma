package br.com.enturma.voice;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.time.Instant;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VoiceService {
  private final VoiceProvider provider;
  private final StudyService study;
  private final Db db;
  private final br.com.enturma.moderation.AutoModService automod;

  public VoiceService(
      VoiceProvider provider,
      StudyService study,
      Db db,
      br.com.enturma.moderation.AutoModService automod) {
    this.provider = provider;
    this.study = study;
    this.db = db;
    this.automod = automod;
  }

  @Transactional
  public Object join(Actor a, UUID room) {
    var r = study.activeLocked(room);
    study.member(a, room);
    automod.allowed(a.id(), room);
    long expires =
        Math.min(
            Instant.now().plusSeconds(60).getEpochSecond(),
            Instant.parse((String) r.get("endsAt")).getEpochSecond());
    String name = (String) db.one("SELECT name FROM app_user WHERE id=?", a.id()).get("name");
    String token = provider.token(a.id().toString(), name, room.toString(), expires);
    db.jdbc.update(
        "INSERT INTO voice_room(room_id,last_token_expires_at) VALUES (?,?) ON CONFLICT(room_id) DO"
            + " UPDATE SET last_token_expires_at=EXCLUDED.last_token_expires_at,cleaned_at=NULL",
        room,
        java.sql.Timestamp.from(Instant.ofEpochSecond(expires)));
    return Map.of("token", token, "url", provider.url());
  }

  @Scheduled(fixedDelay = 10000)
  public void reconcile() {
    if (!provider.enabled()) return;
    for (var r :
        db.list(
            "SELECT v.*,r.ends_at,r.status FROM voice_room v JOIN study_room r ON r.id=v.room_id"
                + " WHERE v.cleaned_at IS NULL LIMIT 100")) {
      UUID room = (UUID) r.get("roomId");
      try {
        if (r.get("status").equals("ENDED")
            || !Instant.parse((String) r.get("endsAt")).isAfter(Instant.now())) {
          provider.deleteRoom(room.toString());
          if (Instant.parse((String) r.get("lastTokenExpiresAt"))
              .isBefore(Instant.now().minusSeconds(10)))
            db.jdbc.update("UPDATE voice_room SET cleaned_at=now() WHERE room_id=?", room);
        } else
          for (String identity : provider.participants(room.toString())) {
            UUID user;
            try {
              user = UUID.fromString(identity);
            } catch (IllegalArgumentException e) {
              provider.remove(room.toString(), identity);
              continue;
            }
            try {
              automod.allowed(user, room);
            } catch (br.com.enturma.moderation.PenaltyException denied) {
              provider.remove(room.toString(), identity);
              continue;
            }
            if (!db.exists(
                "SELECT EXISTS(SELECT 1 FROM room_participant p JOIN app_user u ON u.id=p.user_id"
                    + " WHERE p.room_id=? AND p.user_id=? AND p.left_at IS NULL AND NOT p.removed"
                    + " AND u.status='ACTIVE')",
                room,
                user)) provider.remove(room.toString(), identity);
          }
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(VoiceService.class)
            .warn("Voice reconciliation failed for room {}", room);
      }
    }
  }
}
