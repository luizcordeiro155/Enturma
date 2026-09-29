package br.com.enturma.learning;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

  public record Attempt(
      @NotBlank String game, @Min(1) @Max(4) int level, @NotNull @Size(max = 80) String answer) {}

  @PostMapping("/attempts")
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
    return Map.of(
        "correct",
        correct,
        "message",
        correct
            ? "Desafio concluído! Seu progresso foi salvo."
            : "Ainda não. Execute passo a passo e tente novamente.");
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
