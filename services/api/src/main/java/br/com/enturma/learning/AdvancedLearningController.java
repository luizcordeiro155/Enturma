package br.com.enturma.learning;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.regex.Matcher;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/learning/advanced")
public class AdvancedLearningController {
  private final Db db;
  private final LearningController access;

  private static final Map<Integer, List<String>> WORDS = Map.of(
      1, List.of("CACHE","ARRAY","CLOUD","STACK","TOKEN","CLASS","REACT","LINUX"),
      2, List.of("REDIS","NGINX","REGEX","BYTES","ASYNC","PROXY","QUEUE","MUTEX"),
      3, List.of("KAFKA","SOCKET","MALLOC","SCHEMA","KERNEL","BRANCH","BINARY","THREAD"),
      4, List.of("LAMBDA","SHARDING","WEBHOOK","SERIALIZE","DEADLOCK","RECURSION","INDEXING","PIPELINE"),
      5, List.of("IDEMPOTENT","BACKPRESSURE","CONSISTENCY","MEMOIZATION","POLYMORPHISM","OBSERVABILITY","ORCHESTRATOR","SERIALIZABLE"));

  public AdvancedLearningController(Db db, LearningController access) {
    this.db = db;
    this.access = access;
  }

  private void require(Actor a) {
    if (!access.eligible(a))
      throw new ApiException(403, "LEARNING_NOT_AVAILABLE", "Os jogos são liberados para estudantes de TI.");
  }

  @GetMapping("/words/challenge")
  public Object wordChallenge(
      @AuthenticationPrincipal Actor a,
      @RequestParam(defaultValue = "SOLO") String mode,
      @RequestParam(defaultValue = "1") int difficulty,
      @RequestParam(defaultValue = "false") boolean daily) {
    require(a);
    String normalizedMode = normalizeMode(mode);
    int d = Math.clamp(difficulty, 1, 5);
    String seed = (daily ? LocalDate.now(ZoneOffset.UTC).toString() : "practice")
        + ":" + normalizedMode + ":" + d;
    var targets = targets(seed, normalizedMode, d);
    int maxAttempts = normalizedMode.equals("QUARTET") ? 11 : normalizedMode.equals("DUET") ? 8 : 6;
    return Map.of(
        "challengeKey", seed,
        "mode", normalizedMode,
        "difficulty", d,
        "boards", targets.size(),
        "wordLength", targets.getFirst().length(),
        "maxAttempts", maxAttempts,
        "daily", daily,
        "category", "Programação e tecnologia");
  }

  public record WordAttempt(
      @NotBlank String challengeKey,
      @NotBlank String mode,
      @Min(1) @Max(5) int difficulty,
      @NotBlank @Size(max = 32) String guess,
      @Min(1) @Max(20) int attempt,
      boolean daily,
      @Min(0) int durationMs) {}

  @PostMapping("/words/attempt")
  @Transactional
  public Object wordAttempt(@AuthenticationPrincipal Actor a, @Valid @RequestBody WordAttempt r) {
    require(a);
    String mode = normalizeMode(r.mode());
    int d = Math.clamp(r.difficulty(), 1, 5);
    String expectedPrefix = r.daily() ? LocalDate.now(ZoneOffset.UTC).toString() : "practice";
    String expectedKey = expectedPrefix + ":" + mode + ":" + d;
    if (!expectedKey.equals(r.challengeKey())) throw ApiException.invalid("Desafio expirado. Atualize a página.");

    var targets = targets(expectedKey, mode, d);
    String guess = normalizeWord(r.guess());
    if (guess.length() != targets.getFirst().length())
      throw ApiException.invalid("A palavra precisa ter " + targets.getFirst().length() + " letras.");

    List<Map<String,Object>> boards = new ArrayList<>();
    boolean completed = true;
    for (String target : targets) {
      boolean solved = target.equals(guess);
      completed &= solved;
      boards.add(Map.of("marks", marks(target, guess), "solved", solved));
    }
    int maxAttempts = mode.equals("QUARTET") ? 11 : mode.equals("DUET") ? 8 : 6;
    boolean finished = completed || r.attempt() >= maxAttempts;

    if (finished) {
      db.jdbc.update(
          "INSERT INTO word_game_result(id,user_id,challenge_key,mode,difficulty,attempts,won,daily,duration_ms)"
              + " VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,challenge_key) DO UPDATE SET"
              + " attempts=LEAST(word_game_result.attempts,EXCLUDED.attempts),won=word_game_result.won OR EXCLUDED.won,"
              + " duration_ms=CASE WHEN EXCLUDED.won THEN EXCLUDED.duration_ms ELSE word_game_result.duration_ms END",
          UUID.randomUUID(), a.id(), expectedKey, mode, d, r.attempt(), completed, r.daily(), r.durationMs());
      if (r.daily()) {
        db.jdbc.update(
            "INSERT INTO daily_word_progress(user_id,challenge_date,mode,difficulty,attempts,completed,completed_at)"
                + " VALUES (?,?,?,?,?,?,CASE WHEN ? THEN now() END) ON CONFLICT(user_id,challenge_date,mode)"
                + " DO UPDATE SET attempts=EXCLUDED.attempts,completed=daily_word_progress.completed OR EXCLUDED.completed,"
                + " completed_at=coalesce(daily_word_progress.completed_at,EXCLUDED.completed_at)",
            a.id(), LocalDate.now(ZoneOffset.UTC), mode, d, r.attempt(), completed, completed);
      }
      if (completed) awardXp(a.id(), "word:" + expectedKey, 25 + d * 10 + (mode.equals("QUARTET") ? 30 : mode.equals("DUET") ? 15 : 0));
    }

    return Map.of(
        "boards", boards,
        "completed", completed,
        "finished", finished,
        "attempt", r.attempt(),
        "maxAttempts", maxAttempts,
        "message", completed ? "Desafio concluído!" : finished ? "Fim da rodada. Tente um novo desafio." : "Continue investigando.");
  }

  @GetMapping("/words/stats")
  public Object wordStats(@AuthenticationPrincipal Actor a) {
    require(a);
    var stats = db.one(
        "SELECT count(*) games,count(*) FILTER(WHERE won) wins,coalesce(avg(attempts) FILTER(WHERE won),0) average_attempts,"
            + " coalesce(max(difficulty) FILTER(WHERE won),0) max_difficulty FROM word_game_result WHERE user_id=?",
        a.id());
    return stats;
  }

  public record AlgorithmAttempt(
      @Min(1) @Max(6) int level,
      @NotBlank @Size(max = 6000) String code,
      @Min(1) @Max(100) int attempts,
      @Min(0) int durationMs) {}

  @PostMapping("/algorithm/evaluate")
  @Transactional
  public Object algorithm(@AuthenticationPrincipal Actor a, @Valid @RequestBody AlgorithmAttempt r) {
    require(a);
    var result = simulate(r.code(), r.level());
    if (result.won()) {
      int stars = result.commands() <= optimal(r.level()) ? 3
          : result.commands() <= optimal(r.level()) + 5 ? 2 : 1;
      db.jdbc.update(
          "INSERT INTO algorithm_game_result(id,user_id,level,command_count,attempts,duration_ms,stars)"
              + " VALUES (?,?,?,?,?,?,?)",
          UUID.randomUUID(), a.id(), r.level(), result.commands(), r.attempts(), r.durationMs(), stars);
      awardXp(a.id(), "algorithm:" + r.level(), 35 + r.level() * 8);
      return Map.of("won", true, "stars", stars, "commands", result.commands(), "frames", result.frames(), "message", "Algoritmo concluído.");
    }
    return Map.of("won", false, "stars", 0, "commands", result.commands(), "frames", result.frames(), "message", result.message());
  }

  private record Simulation(boolean won, int commands, List<Map<String,Integer>> frames, String message) {}

  private Simulation simulate(String raw, int level) {
    String code = raw.replaceAll("//.*", "").trim();
    if (level >= 2 && !code.matches("(?s).*(if|switch|for|while|repeat\\s*\\().*"))
      return new Simulation(false, 0, List.of(), "Este nível exige uma estrutura de controle.");
    if (level >= 4 && !code.matches("(?s).*(function|const\\s+\\w+\\s*=\\s*\\(|=>).*"))
      return new Simulation(false, 0, List.of(), "Este nível exige criar ou reutilizar uma função.");

    List<String> commands = new ArrayList<>();
    java.util.regex.Pattern repeat = java.util.regex.Pattern.compile("repeat\\s*\\(\\s*(\\d{1,2})\\s*,\\s*(moveForward|moveRight|moveLeft|moveUp|moveDown)\\s*\\)", java.util.regex.Pattern.CASE_INSENSITIVE);
    Matcher rm = repeat.matcher(code);
    while (rm.find()) {
      int n = Math.min(20, Integer.parseInt(rm.group(1)));
      for (int i=0;i<n;i++) commands.add(rm.group(2).toLowerCase(Locale.ROOT));
    }
    Matcher direct = java.util.regex.Pattern.compile("(moveForward|moveRight|moveLeft|moveUp|moveDown)\\s*\\(\\s*\\)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(code);
    while (direct.find()) commands.add(direct.group(1).toLowerCase(Locale.ROOT));
    if (commands.isEmpty()) return new Simulation(false, 0, List.of(), "Nenhum comando de movimento foi encontrado.");
    if (commands.size() > commandLimit(level))
      return new Simulation(false, commands.size(), List.of(), "Você usou comandos acima do limite deste nível.");

    int x=0,y=0,dir=1;
    List<Map<String,Integer>> frames = new ArrayList<>();
    frames.add(Map.of("x",x,"y",y));
    Set<Integer> walls = walls(level);
    int steps=0;
    for (String cmd : commands) {
      if (++steps > 120) return new Simulation(false, steps, frames, "Seu algoritmo entrou em loop ou excedeu o limite de execução.");
      switch (cmd) {
        case "moveright" -> x++;
        case "moveleft" -> x--;
        case "moveup" -> y--;
        case "movedown" -> y++;
        case "moveforward" -> { x += new int[]{0,1,0,-1}[dir]; y += new int[]{-1,0,1,0}[dir]; }
        default -> {}
      }
      if (x<0 || x>5 || y<0 || y>5 || walls.contains(y*6+x)) {
        frames.add(Map.of("x",Math.clamp(x,0,5),"y",Math.clamp(y,0,5)));
        return new Simulation(false, commands.size(), frames, "O caminho colidiu com um obstáculo.");
      }
      frames.add(Map.of("x",x,"y",y));
    }
    boolean won = x==5 && y==5;
    return new Simulation(won, commands.size(), frames, won ? "" : "Esse caminho não alcança o objetivo.");
  }

  private int commandLimit(int level) { return new int[]{18,18,16,14,12,10}[level-1]; }
  private int optimal(int level) { return new int[]{10,10,10,10,10,10}[level-1]; }
  private Set<Integer> walls(int level) {
    return switch(level) {
      case 1 -> Set.of(8,14,20);
      case 2 -> Set.of(7,8,14,20,26);
      case 3 -> Set.of(7,13,14,15,21,27);
      case 4 -> Set.of(2,8,14,20,26,27);
      case 5 -> Set.of(6,7,13,19,25,31);
      default -> Set.of(1,7,8,14,20,21,27,33);
    };
  }

  private String normalizeMode(String mode) {
    String value = mode == null ? "SOLO" : mode.toUpperCase(Locale.ROOT);
    if (!Set.of("SOLO","DUET","QUARTET").contains(value)) throw ApiException.invalid("Modo inválido.");
    return value;
  }

  private String normalizeWord(String value) {
    return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
  }

  private List<String> targets(String seed, String mode, int difficulty) {
    List<String> pool = WORDS.get(difficulty);
    int count = mode.equals("QUARTET") ? 4 : mode.equals("DUET") ? 2 : 1;
    int length = pool.get(Math.floorMod(seed.hashCode(), pool.size())).length();
    List<String> compatible = pool.stream().filter(w -> w.length() == length).toList();
    if (compatible.size() < count) compatible = pool;
    List<String> result = new ArrayList<>();
    for (int i=0;i<count;i++) result.add(compatible.get(Math.floorMod(Objects.hash(seed,i), compatible.size())));
    return result;
  }

  private String marks(String target, String guess) {
    char[] out = new char[target.length()];
    int[] remaining = new int[26];
    Arrays.fill(out, 'A');
    for (int i=0;i<target.length();i++) {
      if (guess.charAt(i)==target.charAt(i)) out[i]='C';
      else remaining[target.charAt(i)-'A']++;
    }
    for (int i=0;i<target.length();i++) {
      if (out[i]=='C') continue;
      int index=guess.charAt(i)-'A';
      if (index>=0 && index<26 && remaining[index]>0) { out[i]='P'; remaining[index]--; }
    }
    return new String(out);
  }

  private void awardXp(UUID user, String key, int amount) {
    db.jdbc.update("INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", user);
    int inserted = db.jdbc.update(
        "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES (?,?,?,?,?)"
            + " ON CONFLICT(user_id,event_key) DO NOTHING",
        UUID.randomUUID(), user, key, amount, "ADVANCED_GAME");
    if (inserted == 1)
      db.jdbc.update("UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?", amount, user);
  }
}
