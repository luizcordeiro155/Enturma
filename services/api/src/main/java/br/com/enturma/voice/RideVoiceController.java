package br.com.enturma.voice;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.rides.RideService;
import java.time.Instant;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/matches")
public class RideVoiceController {
  private final RideService rides;
  private final VoiceProvider voice;
  private final Db db;

  public RideVoiceController(RideService rides, VoiceProvider voice, Db db) {
    this.rides = rides;
    this.voice = voice;
    this.db = db;
  }

  @PostMapping("/{id}/voice")
  public Object join(@AuthenticationPrincipal Actor actor, @PathVariable UUID id) {
    var match = rides.access(actor, id);
    if (!match.get("rideStatus").equals("OPEN")) throw ApiException.invalid("Carona encerrada.");
    if (!voice.enabled())
      throw new ApiException(
          503, "VOICE_UNAVAILABLE", "As chamadas precisam ser habilitadas pelo administrador.");
    String name = (String) db.one("SELECT name FROM app_user WHERE id=?", actor.id()).get("name");
    String token =
        voice.token(
            actor.id().toString(),
            name,
            "ride-" + id,
            Instant.now().plusSeconds(60).getEpochSecond());
    db.jdbc.update(
        "INSERT INTO ride_voice(match_id) VALUES (?) ON CONFLICT(match_id) DO UPDATE SET"
            + " updated_at=now(),cleaned=false",
        id);
    return Map.of("token", token, "url", voice.url());
  }

  @Scheduled(fixedDelay = 10000)
  public void reconcile() {
    if (!voice.enabled()) return;
    for (var row :
        db.list("SELECT match_id,updated_at FROM ride_voice WHERE NOT cleaned LIMIT 100")) {
      UUID id = (UUID) row.get("matchId");
      String room = "ride-" + id;
      try {
        boolean open =
            db.exists(
                "SELECT EXISTS(SELECT 1 FROM ride_match m JOIN ride r ON r.id=m.ride_id WHERE"
                    + " m.id=? AND m.status='ACCEPTED' AND r.status='OPEN')",
                id);
        if (!open) {
          voice.deleteRoom(room);
          if (Instant.parse((String) row.get("updatedAt")).isBefore(Instant.now().minusSeconds(90)))
            db.jdbc.update("UPDATE ride_voice SET cleaned=true WHERE match_id=?", id);
        } else
          for (String identity : voice.participants(room)) {
            boolean allowed =
                db.exists(
                    "SELECT EXISTS(SELECT 1 FROM ride_match m JOIN ride r ON r.id=m.ride_id JOIN"
                        + " app_user u ON u.id=? WHERE m.id=? AND u.status='ACTIVE' AND"
                        + " (u.id=m.user_id OR u.id=r.owner_id) AND NOT EXISTS(SELECT 1 FROM"
                        + " user_block b WHERE (b.user_id=m.user_id AND b.blocked_id=r.owner_id) OR"
                        + " (b.blocked_id=m.user_id AND b.user_id=r.owner_id)))",
                    UUID.fromString(identity),
                    id);
            if (!allowed) voice.remove(room, identity);
          }
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(getClass())
            .warn("Falha ao reconciliar chamada da carona {}", id);
      }
    }
  }
}
