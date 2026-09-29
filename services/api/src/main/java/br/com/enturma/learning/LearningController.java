package br.com.enturma.learning;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/learning")
public class LearningController {
  private final Db db;

  public LearningController(Db db) {
    this.db = db;
  }

  public boolean eligible(Actor actor) {
    return actor != null
        && db.exists(
            "SELECT EXISTS(SELECT 1 FROM academic_enrollment e JOIN academic_entry c ON"
                + " c.id=e.course_offering_id WHERE e.user_id=? AND c.status='VERIFIED' AND"
                + " (c.attributes->>'learningArea'='IT' OR EXISTS(SELECT 1 FROM user_subject us"
                + " JOIN academic_entry s ON s.id=us.subject_id WHERE us.user_id=e.user_id AND"
                + " s.status='VERIFIED' AND (s.attributes->>'learningArea'='IT' OR"
                + " s.normalized_name ~ '(algoritmos|programacao|desenvolvimento"
                + " web|computacao)'))) AND NOT EXISTS(WITH RECURSIVE ancestors AS (SELECT"
                + " id,parent_id,status FROM academic_entry WHERE id=e.period_id UNION ALL SELECT"
                + " p.id,p.parent_id,p.status FROM academic_entry p JOIN ancestors a ON"
                + " p.id=a.parent_id) SELECT 1 FROM ancestors WHERE status<>'VERIFIED'))",
            actor.id());
  }

  private void require(Actor a) {
    if (!eligible(a))
      throw new ApiException(
          403,
          "LEARNING_NOT_AVAILABLE",
          "Os jogos são liberados para matrículas verificadas em cursos ou UCs de programação e"
              + " TI.");
  }

  @GetMapping("/access")
  public Object access(@AuthenticationPrincipal Actor a) {
    return Map.of("eligible", eligible(a));
  }

  @GetMapping("/progress")
  public Object progress(@AuthenticationPrincipal Actor a) {
    require(a);
    return db.list(
        "SELECT game,level,attempts,completed,completed_at FROM learning_progress WHERE user_id=?"
            + " ORDER BY game,level",
        a.id());
  }

  @GetMapping("/summary")
  public Object summary(@AuthenticationPrincipal Actor a) {
    require(a);
    ensureStats(a.id());
    var stats =
        db.one(
            "SELECT total_xp,current_streak,longest_streak,last_active_date FROM learning_stats"
                + " WHERE user_id=?",
            a.id());
    int xp = ((Number) stats.get("totalXp")).intValue();
    int level = xp / 250 + 1;
    int intoLevel = xp % 250;
    var result = new LinkedHashMap<String, Object>(stats);
    result.put("level", level);
    result.put("xpIntoLevel", intoLevel);
    result.put("xpForNextLevel", 250);
    result.put("daily", daily(a));
    return result;
  }

  @GetMapping("/daily")
  public Map<String, Object> daily(@AuthenticationPrincipal Actor a) {
    require(a);
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    int slot = Math.floorMod(Objects.hash(today.toString(), a.id().toString()), 12);
    String[] games = {"robot", "binary", "trace"};
    String game = games[slot / 4];
    int level = slot % 4 + 1;
    var saved =
        db.list(
            "SELECT attempts,completed,completed_at FROM daily_learning_progress WHERE user_id=?"
                + " AND challenge_date=?",
            a.id(),
            today);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("date", today.toString());
    result.put("game", game);
    result.put("level", level);
    result.put("rewardXp", 40);
    result.put("attempts", saved.isEmpty() ? 0 : saved.getFirst().get("attempts"));
    result.put("completed", !saved.isEmpty() && Boolean.TRUE.equals(saved.getFirst().get("completed")));
    return result;
  }

  public record Attempt(
      @NotBlank String game,
      @Min(1) @Max(4) int level,
      @NotNull @Size(max = 80) String answer,
      boolean daily) {
    public Attempt(String game, int level, String answer) {
      this(game, level, answer, false);
    }
  }

  @PostMapping("/attempts")
  @Transactional
  public Object attempt(@AuthenticationPrincipal Actor a, @Valid @RequestBody Attempt input) {
    require(a);
    boolean correct = check(input.game(), input.level(), input.answer());
    db.jdbc.update(
        "INSERT INTO learning_progress(user_id,game,level,attempts,completed,completed_at) VALUES"
            + " (?,?,?,1,?,CASE WHEN ? THEN now() END) ON CONFLICT(user_id,game,level) DO UPDATE"
            + " SET attempts=learning_progress.attempts+1,completed=learning_progress.completed OR"
            + " EXCLUDED.completed,completed_at=coalesce(learning_progress.completed_at,EXCLUDED.completed_at),updated_at=now()",
        a.id(),
        input.game(),
        input.level(),
        correct,
        correct);

    int xpAwarded = 0;
    if (correct) {
      xpAwarded +=
          awardXp(
              a.id(),
              "level:" + input.game() + ":" + input.level(),
              20 + input.level() * 5,
              "LEVEL_COMPLETED");
      touchStreak(a.id());

      if (input.daily()) {
        var daily = daily(a);
        if (!daily.get("game").equals(input.game())
            || ((Number) daily.get("level")).intValue() != input.level())
          throw ApiException.invalid("Este não é o desafio diário de hoje.");
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        db.jdbc.update(
            "INSERT INTO daily_learning_progress(user_id,challenge_date,game,level,attempts,completed,completed_at)"
                + " VALUES (?,?,?,?,1,true,now()) ON CONFLICT(user_id,challenge_date) DO UPDATE SET"
                + " attempts=daily_learning_progress.attempts+1,completed=true,"
                + " completed_at=coalesce(daily_learning_progress.completed_at,now())",
            a.id(),
            today,
            input.game(),
            input.level());
        xpAwarded +=
            awardXp(a.id(), "daily:" + today, 40, "DAILY_CHALLENGE");
      }
    } else if (input.daily()) {
      var daily = daily(a);
      if (daily.get("game").equals(input.game())
          && ((Number) daily.get("level")).intValue() == input.level())
        db.jdbc.update(
            "INSERT INTO daily_learning_progress(user_id,challenge_date,game,level,attempts,completed)"
                + " VALUES (?,?,?,?,1,false) ON CONFLICT(user_id,challenge_date) DO UPDATE SET"
                + " attempts=daily_learning_progress.attempts+1",
            a.id(),
            LocalDate.now(ZoneOffset.UTC),
            input.game(),
            input.level());
    }

    ensureStats(a.id());
    var stats =
        db.one(
            "SELECT total_xp,current_streak,longest_streak FROM learning_stats WHERE user_id=?",
            a.id());
    return Map.of(
        "correct",
        correct,
        "xpAwarded",
        xpAwarded,
        "totalXp",
        stats.get("totalXp"),
        "streak",
        stats.get("currentStreak"),
        "message",
        correct
            ? "Desafio concluído! Seu progresso e XP foram atualizados."
            : "Ainda não. Execute passo a passo e tente novamente.");
  }

  private void ensureStats(UUID user) {
    db.jdbc.update(
        "INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT(user_id) DO NOTHING", user);
  }

  private int awardXp(UUID user, String key, int amount, String reason) {
    ensureStats(user);
    int inserted =
        db.jdbc.update(
            "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES (?,?,?,?,?)"
                + " ON CONFLICT(user_id,event_key) DO NOTHING",
            UUID.randomUUID(),
            user,
            key,
            amount,
            reason);
    if (inserted == 1)
      db.jdbc.update(
          "UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?",
          amount,
          user);
    return inserted == 1 ? amount : 0;
  }

  private void touchStreak(UUID user) {
    ensureStats(user);
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    var stats =
        db.one(
            "SELECT current_streak,last_active_date FROM learning_stats WHERE user_id=? FOR UPDATE",
            user);
    String last = (String) stats.get("lastActiveDate");
    if (last != null && last.equals(today.toString())) return;
    int current = ((Number) stats.get("currentStreak")).intValue();
    int next =
        last != null && LocalDate.parse(last).equals(today.minusDays(1)) ? current + 1 : 1;
    db.jdbc.update(
        "UPDATE learning_stats SET current_streak=?,longest_streak=greatest(longest_streak,?),"
            + " last_active_date=?,updated_at=now() WHERE user_id=?",
        next,
        next,
        today,
        user);
  }

  public static boolean check(String game, int level, String answer) {
    if (level < 1 || level > 4) throw ApiException.invalid("Nível inválido.");
    if (game.equals("binary"))
      return answer.equals(Integer.toBinaryString(new int[] {5, 10, 19, 42}[level - 1]));
    if (game.equals("trace"))
      return answer.strip().equals(new String[] {"6", "12", "3", "10"}[level - 1]);
    if (game.equals("robot")) {
      if (!answer.matches("[RDLU]{1,24}")) return false;
      int[][] walls = {{1, 5, 6}, {5, 6, 9}, {2, 6, 9, 11}, {1, 5, 9, 10}};
      int x = 0, y = 0;
      for (char c : answer.toCharArray()) {
        switch (c) {
          case 'R' -> x++;
          case 'L' -> x--;
          case 'D' -> y++;
          case 'U' -> y--;
          default -> throw ApiException.invalid("Comando inválido.");
        }
        if (x < 0 || x > 3 || y < 0 || y > 3) return false;
        for (int wall : walls[level - 1]) if (y * 4 + x == wall) return false;
      }
      return x == 3 && y == 3;
    }
    throw ApiException.invalid("Jogo inválido.");
  }
}
