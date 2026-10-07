package br.com.enturma.voice;

import br.com.enturma.auth.Actor;
import br.com.enturma.chat.RealtimePresence;
import br.com.enturma.common.*;
import br.com.enturma.notifications.AppChanged;
import java.time.Instant;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrivateCallService {
  private static final Set<String> ACTIVE =
      Set.of("DIALING", "RINGING", "ACCEPTED", "CONNECTING", "CONNECTED");
  private final Db db;
  private final RealtimePresence presence;
  private final VoiceProvider voice;
  private final ApplicationEventPublisher events;

  public PrivateCallService(
      Db db, RealtimePresence presence, VoiceProvider voice, ApplicationEventPublisher events) {
    this.db = db;
    this.presence = presence;
    this.voice = voice;
    this.events = events;
  }

  private UUID friend(Actor actor, UUID friendship) {
    var f =
        db.one(
            "SELECT requester,recipient FROM friendship WHERE id=? AND status='ACCEPTED' AND"
                + " (requester=? OR recipient=?)",
            friendship,
            actor.id(),
            actor.id());
    UUID peer =
        (UUID) (actor.id().equals(f.get("requester")) ? f.get("recipient") : f.get("requester"));
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM app_user WHERE id=? AND status='ACTIVE')", peer)
        || db.exists(
            "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR"
                + " (user_id=? AND blocked_id=?))",
            actor.id(),
            peer,
            peer,
            actor.id())) throw ApiException.forbidden();
    return peer;
  }

  public Object presence(Actor actor, UUID friendship) {
    return Map.of("online", presence.online(friend(actor, friendship)));
  }

  private void changed(Map<String, Object> call) {
    events.publishEvent(
        new AppChanged(
            "private_call_changed",
            Set.of((UUID) call.get("callerId"), (UUID) call.get("calleeId"))));
  }

  private Map<String, Object> access(Actor actor, UUID id) {
    return db.one(
        "SELECT * FROM private_call WHERE id=? AND (caller_id=? OR callee_id=?) FOR UPDATE",
        id,
        actor.id(),
        actor.id());
  }

  private Map<String, Object> view(UUID id) {
    return db.one(
        "SELECT"
            + " c.id,c.friendship_id,c.caller_id,c.callee_id,c.caller_device,c.callee_device,c.video,c.state,c.expires_at,c.updated_at,a.name"
            + " caller_name,b.name callee_name,a.avatar_bytes IS NOT NULL"
            + " caller_avatar,b.avatar_bytes IS NOT NULL callee_avatar FROM private_call c JOIN"
            + " app_user a ON a.id=c.caller_id JOIN app_user b ON b.id=c.callee_id WHERE c.id=?",
        id);
  }

  @Transactional
  public Object create(Actor actor, UUID friendship, boolean video, UUID device) {
    if (device == null) throw ApiException.invalid("Dispositivo de chamada ausente.");
    UUID peer = friend(actor, friendship);
    if (!voice.enabled())
      throw new ApiException(
          503, "VOICE_UNAVAILABLE", "As chamadas estão indisponíveis no momento.");
    // Lock both users in a stable order: crossed invitations cannot create two rooms.
    db.list("SELECT id FROM app_user WHERE id IN (?,?) ORDER BY id FOR UPDATE", actor.id(), peer);
    if (!presence.online(peer))
      throw new ApiException(
          409, "FRIEND_OFFLINE", "Este amigo está offline. Tente quando ele estiver conectado.");
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM private_call WHERE (caller_id IN (?,?) OR callee_id IN (?,?))"
            + " AND state IN ('DIALING','RINGING','ACCEPTED','CONNECTING','CONNECTED') AND"
            + " expires_at>now())",
        actor.id(),
        peer,
        actor.id(),
        peer))
      throw new ApiException(409, "CALL_BUSY", "Você ou seu amigo já está em uma chamada.");
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM private_call WHERE caller_id=? AND created_at>now()-interval '1"
                + " minute'",
            Integer.class,
            actor.id())
        >= 6)
      throw new ApiException(429, "CALL_RATE_LIMIT", "Aguarde um pouco antes de ligar novamente.");
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO"
            + " private_call(id,friendship_id,caller_id,callee_id,video,caller_device,state,expires_at)"
            + " VALUES (?,?,?,?,?,?,'DIALING',now()+interval '35 seconds')",
        id,
        friendship,
        actor.id(),
        peer,
        video,
        device);
    var result = view(id);
    changed(result);
    return result;
  }

  public Object current(Actor actor) {
    var rows =
        db.list(
            "SELECT id FROM private_call WHERE (caller_id=? OR callee_id=?) AND (state IN"
                + " ('DIALING','RINGING','ACCEPTED','CONNECTING','CONNECTED') OR"
                + " updated_at>now()-interval '5 minutes') ORDER BY CASE WHEN state IN"
                + " ('DIALING','RINGING','ACCEPTED','CONNECTING','CONNECTED') THEN 0 ELSE 1"
                + " END,updated_at DESC LIMIT 1",
            actor.id(),
            actor.id());
    return rows.isEmpty() ? Map.of() : view((UUID) rows.getFirst().get("id"));
  }

  @Transactional
  public Object transition(Actor actor, UUID id, String action, UUID device) {
    var call = access(actor, id);
    String state = (String) call.get("state");
    if (!ACTIVE.contains(state)) return view(id);
    boolean caller = actor.id().equals(call.get("callerId"));
    String next;
    switch (action) {
      case "ring" -> {
        if (caller) throw ApiException.forbidden();
        next = "DIALING".equals(state) ? "RINGING" : state;
      }
      case "accept" -> {
        if (caller || !Set.of("DIALING", "RINGING").contains(state)) throw ApiException.forbidden();
        friend(actor, (UUID) call.get("friendshipId"));
        if (!Instant.parse((String) call.get("expiresAt")).isAfter(Instant.now()))
          throw new ApiException(409, "CALL_EXPIRED", "Esta chamada expirou.");
        next = "ACCEPTED";
        if (device == null) throw ApiException.invalid("Dispositivo de chamada ausente.");
        db.jdbc.update("UPDATE private_call SET callee_device=? WHERE id=?", device, id);
      }
      case "decline" -> {
        if (caller || !Set.of("DIALING", "RINGING").contains(state)) throw ApiException.forbidden();
        next = "DECLINED";
      }
      case "cancel" -> {
        if (!caller || !Set.of("DIALING", "RINGING").contains(state))
          throw ApiException.forbidden();
        next = "CANCELLED";
      }
      case "end" -> next = "ENDED";
      default -> throw ApiException.invalid("Ação de chamada inválida.");
    }
    if (!next.equals(state)) {
      db.jdbc.update(
          "UPDATE private_call SET state=?,updated_at=now(),expires_at=CASE WHEN ?='ACCEPTED' THEN"
              + " now()+interval '45 seconds' ELSE expires_at END WHERE id=?",
          next,
          next,
          id);
      changed(call);
    }
    return view(id);
  }

  @Transactional
  public Object join(Actor actor, UUID id, UUID device) {
    var call = access(actor, id);
    friend(actor, (UUID) call.get("friendshipId"));
    if (device == null
        || !device.equals(
            call.get(actor.id().equals(call.get("callerId")) ? "callerDevice" : "calleeDevice")))
      throw new ApiException(
          409, "CALL_OTHER_DEVICE", "A chamada está aberta em outro dispositivo.");
    if (!Set.of("ACCEPTED", "CONNECTING", "CONNECTED").contains(call.get("state"))
        || !Instant.parse((String) call.get("expiresAt")).isAfter(Instant.now()))
      throw new ApiException(409, "CALL_NOT_ACCEPTED", "A chamada precisa estar aceita e ativa.");
    String name = (String) db.one("SELECT name FROM app_user WHERE id=?", actor.id()).get("name");
    String token =
        voice.token(
            actor.id().toString(),
            name,
            "private-" + id,
            Instant.now().plusSeconds(60).getEpochSecond());
    db.jdbc.update(
        "UPDATE private_call SET state=CASE WHEN state='ACCEPTED' THEN 'CONNECTING' ELSE state"
            + " END,last_token_at=now(),updated_at=now() WHERE id=?",
        id);
    changed(call);
    return Map.of("token", token, "url", voice.url());
  }

  @Transactional
  public Object heartbeat(Actor actor, UUID id) {
    var call = access(actor, id);
    friend(actor, (UUID) call.get("friendshipId"));
    if (!Set.of("CONNECTING", "CONNECTED").contains(call.get("state")))
      throw new ApiException(409, "CALL_ENDED", "A chamada foi encerrada.");
    boolean caller = actor.id().equals(call.get("callerId"));
    // Caller and callee publish liveness only after their LiveKit connection succeeds.
    db.jdbc.update(
        caller
            ? "UPDATE private_call SET caller_heartbeat=now(),caller_connected=true WHERE id=?"
            : "UPDATE private_call SET callee_heartbeat=now(),callee_connected=true WHERE id=?",
        id);
    int updated =
        db.jdbc.update(
            "UPDATE private_call SET"
                + " state='CONNECTED',updated_at=now(),expires_at=created_at+interval '2 hours'"
                + " WHERE id=? AND state='CONNECTING' AND caller_connected AND callee_connected",
            id);
    if (updated > 0) changed(call);
    return view(id);
  }

  @Scheduled(fixedDelay = 3000)
  @Transactional
  public void reconcile() {
    for (var call :
        db.list(
            "SELECT * FROM private_call WHERE state IN"
                + " ('DIALING','RINGING','ACCEPTED','CONNECTING','CONNECTED') FOR UPDATE SKIP"
                + " LOCKED")) {
      boolean expired = Instant.parse((String) call.get("expiresAt")).isBefore(Instant.now());
      boolean invalid =
          !db.exists(
                  "SELECT EXISTS(SELECT 1 FROM friendship WHERE id=? AND status='ACCEPTED')",
                  call.get("friendshipId"))
              || db.exists(
                  "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR"
                      + " (user_id=? AND blocked_id=?))",
                  call.get("callerId"),
                  call.get("calleeId"),
                  call.get("calleeId"),
                  call.get("callerId"));
      if ("CONNECTED".equals(call.get("state")))
        for (String key : List.of("callerHeartbeat", "calleeHeartbeat"))
          expired |=
              call.get(key) == null
                  || Instant.parse((String) call.get(key)).isBefore(Instant.now().minusSeconds(90));
      if (expired || invalid) {
        db.jdbc.update(
            "UPDATE private_call SET state=?,updated_at=now() WHERE id=?",
            Set.of("DIALING", "RINGING").contains(call.get("state")) ? "NO_ANSWER" : "ENDED",
            call.get("id"));
        changed(call);
      }
    }
    if (!voice.enabled()) return;
    for (var call :
        db.list(
            "SELECT * FROM private_call WHERE state IN ('DECLINED','CANCELLED','NO_ANSWER','ENDED')"
                + " AND cleaned_at IS NULL LIMIT 100")) {
      try {
        voice.deleteRoom("private-" + call.get("id"));
        if (call.get("lastTokenAt") == null
            || Instant.parse((String) call.get("lastTokenAt"))
                .isBefore(Instant.now().minusSeconds(70)))
          db.jdbc.update("UPDATE private_call SET cleaned_at=now() WHERE id=?", call.get("id"));
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(getClass())
            .warn("Private call cleanup will retry: {}", call.get("id"));
      }
    }
  }
}
