package br.com.enturma.learning;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study-journey")
public class StudyJourneyController {
  private final Db db;

  public StudyJourneyController(Db db) {
    this.db = db;
  }

  @PostMapping("/sync")
  @Transactional
  public Object sync(@AuthenticationPrincipal Actor a) {
    db.jdbc.update("INSERT INTO study_journey(user_id) VALUES (?) ON CONFLICT DO NOTHING", a.id());
    // Serialize reward reconciliation per user. The unique event keys also guard repeat requests.
    var journey =
        db.one("SELECT tutorial_seen_at FROM study_journey WHERE user_id=? FOR UPDATE", a.id());
    db.jdbc.update("INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", a.id());
    boolean[] evidence = {
      db.exists("SELECT EXISTS(SELECT 1 FROM user_subject WHERE user_id=?)", a.id()),
      db.exists(
          "SELECT EXISTS(SELECT 1 FROM room_participant WHERE user_id=? AND NOT removed)", a.id()),
      db.exists(
          "SELECT EXISTS(SELECT 1 FROM room_message m JOIN room_participant p ON"
              + " p.room_id=m.room_id AND p.user_id=m.user_id WHERE m.user_id=? AND m.deleted_at IS"
              + " NULL AND NOT p.removed)",
          a.id())
    };
    String[] keys = {"subject", "room", "message"};
    int[] amounts = {20, 30, 50};
    int awarded = 0, completed = 0;
    List<Object> steps = new ArrayList<>();
    for (int i = 0; i < keys.length; i++) {
      String key = "study-journey:" + keys[i];
      if (evidence[i]) {
        int inserted =
            db.jdbc.update(
                "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES"
                    + " (?,?,?,?,?) ON CONFLICT(user_id,event_key) DO NOTHING",
                UUID.randomUUID(),
                a.id(),
                key,
                amounts[i],
                "Primeiros passos no Enturma");
        if (inserted == 1) awarded += amounts[i];
      }
      boolean done =
          db.exists(
              "SELECT EXISTS(SELECT 1 FROM learning_xp_event WHERE user_id=? AND event_key=?)",
              a.id(),
              key);
      if (done) completed++;
      steps.add(Map.of("key", keys[i], "completed", done, "xp", amounts[i]));
    }
    if (awarded > 0)
      db.jdbc.update(
          "UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?",
          awarded,
          a.id());
    int xp =
        ((Number)
                db.one("SELECT total_xp FROM learning_stats WHERE user_id=?", a.id())
                    .get("totalXp"))
            .intValue();
    return Map.of(
        "steps",
        steps,
        "completed",
        completed,
        "totalXp",
        xp,
        "level",
        xp / 250 + 1,
        "xpAwarded",
        awarded,
        "tutorialSeen",
        journey.get("tutorialSeenAt") != null);
  }

  @PostMapping("/tutorial-seen")
  public void seen(@AuthenticationPrincipal Actor a) {
    db.jdbc.update(
        "INSERT INTO study_journey(user_id,tutorial_seen_at) VALUES (?,now()) ON CONFLICT(user_id)"
            + " DO UPDATE SET tutorial_seen_at=now()",
        a.id());
  }
}
