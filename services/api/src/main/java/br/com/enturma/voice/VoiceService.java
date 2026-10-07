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
  private final br.com.enturma.study.RoomEvents roomEvents;

  public VoiceService(
      VoiceProvider provider,
      StudyService study,
      Db db,
      br.com.enturma.moderation.AutoModService automod,
      br.com.enturma.study.RoomEvents roomEvents) {
    this.provider = provider;
    this.study = study;
    this.db = db;
    this.automod = automod;
    this.roomEvents = roomEvents;
  }

  @Transactional
  public void state(Actor actor, UUID room, VoiceController.Presence value) {
    if (value.connectionId() == null) throw ApiException.invalid("Conexão de voz inválida.");
    study.member(actor, room);
    if (value.connected()) {
      study.activeLocked(room);
      automod.allowed(actor.id(), room);
    }
    var rows =
        db.list(
            "SELECT * FROM room_voice_presence WHERE room_id=? AND user_id=? FOR UPDATE",
            room,
            actor.id());
    var previous = rows.isEmpty() ? null : rows.getFirst();
    if (!value.connected()
        && (previous == null || !value.connectionId().equals(previous.get("connectionId")))) return;
    boolean wasConnected =
        previous != null
            && Boolean.TRUE.equals(previous.get("connected"))
            && Instant.parse((String) previous.get("updatedAt"))
                .isAfter(Instant.now().minusSeconds(50));
    String kind = null;
    String message = null;
    String name = (String) db.one("SELECT name FROM app_user WHERE id=?", actor.id()).get("name");
    if (!wasConnected && value.connected()) {
      kind = "VOICE_JOINED";
      message = name + " entrou na chamada.";
    } else if (wasConnected && !value.connected()) {
      kind = "VOICE_LEFT";
      message = name + " saiu da chamada.";
    } else if (wasConnected && Boolean.TRUE.equals(previous.get("screen")) != value.screen()) {
      kind = value.screen() ? "SCREEN_STARTED" : "SCREEN_STOPPED";
      message =
          name
              + (value.screen()
                  ? " começou a compartilhar a tela."
                  : " encerrou o compartilhamento de tela.");
    }
    boolean announce =
        kind != null
            && (previous == null
                || Instant.parse((String) previous.get("lastEventAt"))
                    .isBefore(Instant.now().minusSeconds(5)));
    db.jdbc.update(
        "INSERT INTO"
            + " room_voice_presence(room_id,user_id,connection_id,microphone,camera,screen,deafened,connected)"
            + " VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(room_id,user_id) DO UPDATE SET"
            + " connection_id=EXCLUDED.connection_id,microphone=EXCLUDED.microphone,camera=EXCLUDED.camera,screen=EXCLUDED.screen,deafened=EXCLUDED.deafened,connected=EXCLUDED.connected,updated_at=now(),last_event_at=CASE"
            + " WHEN ? THEN now() ELSE room_voice_presence.last_event_at END",
        room,
        actor.id(),
        value.connectionId(),
        value.microphone(),
        value.camera(),
        value.screen(),
        value.deafened(),
        value.connected(),
        announce);
    if (announce) roomEvents.add(room, actor.id(), kind, message, "voice:" + UUID.randomUUID());
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
    for (var expired :
        db.list(
            "UPDATE room_voice_presence SET"
                + " connected=false,microphone=false,camera=false,screen=false,updated_at=now(),last_event_at=now()"
                + " WHERE connected AND updated_at<now()-interval '50 seconds' RETURNING"
                + " room_id,user_id,connection_id")) {
      UUID user = (UUID) expired.get("userId");
      String name = (String) db.one("SELECT name FROM app_user WHERE id=?", user).get("name");
      roomEvents.add(
          (UUID) expired.get("roomId"),
          user,
          "VOICE_LEFT",
          name + " saiu da chamada.",
          "voice-expired:" + expired.get("connectionId"));
    }
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
