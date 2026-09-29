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
@RequestMapping("/api/v1/learning/advanced")
public class AdvancedLearningController {
  private final Db db;
  private final LearningController access;

  private static final Map<Integer, List<String>> WORDS =
      Map.of(
          1,
              List.of(
                  "CACHE ARRAY CLOUD STACK TOKEN CLASS REACT LINUX HTML JAVA JSON LOOP NODE HEAP HASH BYTE PORT LINK CODE DATA BOOL CHAR FLOAT INPUT PRINT WHILE BREAK CONST EVENT INDEX QUERY TABLE FIELD VALUE ROUTE MODEL VIEWS STYLE CLICK DEBUG PATCH MERGE CLONE FETCH PUSH PULL SORT TREE LIST FILE PATH SHELL SCRIPT STRING RETURN SWITCH OBJECT METHOD PYTHON DOCKER SERVER CLIENT"
                      .split(" ")),
          2,
              List.of(
                  "REDIS NGINX REGEX BYTES ASYNC PROXY QUEUE MUTEX UNION JOINS WHERE LIMIT GROUP ORDER COUNT CROSS INNER OUTER DISTINCT SELECT INSERT UPDATE DELETE COMMIT REBASE BRANCH REMOTE ORIGIN STREAM SOCKET SCHEMA KERNEL THREAD BUFFER PROMISE CLOSURE MODULE EXPORT IMPORT BUNDLE CHUNKS WEBPACK COMPILER RUNTIME ADAPTER BUILDER FACTORY OBSERVER HANDLER PAYLOAD REQUEST RESPONSE SESSION COOKIE HEADER STATUS"
                      .split(" ")),
          3,
              List.of(
                  "KAFKA MONGO SPARK FLINK INDEX LOCKS SHARD LEASE CRON GRANT REVOKE UPSERT MERGED CURSOR TRIGGER SCALAR VECTOR TENSOR MATRIX EMBED LATENT NEURON EPOCH BATCH GRADIENT ENTROPY SIGMOID SOFTMAX DROPOUT PRUNING LAMBDA FUTURE ACTOR FIBER YIELD SPAWN ATOMIC CASCADE GARBAGE SERIAL PARSER LEXER ASTAR DIJKSTRA BELLMAN KRUSKAL PRIM QUICK SORTING BINARY SEARCH TRAVERSAL"
                      .split(" ")),
          4,
              List.of(
                  "SHARDING WEBHOOK DEADLOCK PIPELINE INDEXING DISPATCH SNAPSHOT ROLLBACK SAVEPOINT ISOLATION RECURSION MONAD FUNCTOR APPLICATIVE TRAMPOLINE CURRYING CLOSURES TYPECLASS COVARIANT INVARIANT CONSTRAINT INFERENCE GENERICS OVERLOAD OVERRIDE SERIALIZE DESERIALIZE CHECKSUM MERKLE BLOOM HYPERLOGLOG CONSENSUS QUORUM PAXOS RAFT GOSSIP VECTORCLOCK TOMBSTONE COMPACTION PARTITION REPLICATION FAILOVER SEMAPHORE SPINLOCK LOCKFREE WAITFREE"
                      .split(" ")),
          5,
              List.of(
                  "IDEMPOTENT BACKPRESSURE CONSISTENCY MEMOIZATION POLYMORPHISM OBSERVABILITY ORCHESTRATOR SERIALIZABLE LINEARIZABLE COMMUTATIVITY ASSOCIATIVITY DISTRIBUTIVITY HOMOMORPHISM ISOMORPHISM CONTINUATION COROUTINE COINDUCTION BISECTION BISIMULATION INVARIANCE CONTRAVARIANT METAPROGRAMMING INTROSPECTION REFLECTION REIFICATION DEFUNCTOR FUNCTIONAL REFERENTIAL TRANSPARENCY DETERMINISM NONDETERMINISM SYNCHRONIZATION LAMPORT BYZANTINE CONVERGENCE COMMUTATIVE IDEMPOTENCE CRYPTOGRAPHY AUTHENTICATION AUTHORIZATION CAPABILITY SANDBOXING HYPERVISOR VIRTUALIZATION SPECULATION PREFETCHING VECTORIZATION PARALLELISM DISTRIBUTED TRANSACTIONAL"
                      .split(" ")));

  public AdvancedLearningController(Db db, LearningController access) {
    this.db = db;
    this.access = access;
  }

  private void require(Actor a) {
    if (!access.eligible(a))
      throw new ApiException(
          403, "LEARNING_NOT_AVAILABLE", "Os jogos são liberados para estudantes de TI.");
  }

  @GetMapping("/words/vocabulary")
  public List<String> wordVocabulary(@AuthenticationPrincipal Actor a) {
    require(a);
    return WORDS.values().stream().flatMap(List::stream).distinct().sorted().toList();
  }

  @Transactional
  @GetMapping("/words/challenge")
  public Object wordChallenge(
      @AuthenticationPrincipal Actor a,
      @RequestParam(defaultValue = "SOLO") String mode,
      @RequestParam(defaultValue = "1") int difficulty,
      @RequestParam(defaultValue = "false") boolean daily) {
    require(a);
    String normalizedMode = normalizeMode(mode);
    int d = Math.clamp(difficulty, 1, 5);
    String seed =
        (daily ? LocalDate.now(ZoneOffset.UTC).toString() : "practice-" + UUID.randomUUID())
            + ":"
            + normalizedMode
            + ":"
            + d;
    db.jdbc.update(
        "INSERT INTO word_game_session(user_id,challenge_key,mode,difficulty,daily) VALUES"
            + " (?,?,?,?,?) ON CONFLICT DO NOTHING",
        a.id(),
        seed,
        normalizedMode,
        d,
        daily);
    var targets = targets(seed, normalizedMode, d);
    int maxAttempts = normalizedMode.equals("QUARTET") ? 11 : normalizedMode.equals("DUET") ? 8 : 6;
    var response =
        new LinkedHashMap<String, Object>(
            Map.of(
                "challengeKey", seed,
                "mode", normalizedMode,
                "difficulty", d,
                "boards", targets.size(),
                "wordLength", targets.getFirst().length(),
                "maxAttempts", maxAttempts,
                "daily", daily,
                "category", "Programação e tecnologia"));
    var previous =
        db.jdbc.queryForList(
            "SELECT unnest(guesses) FROM word_game_session WHERE user_id=? AND challenge_key=?",
            String.class,
            a.id(),
            seed);
    response.put(
        "history",
        previous.stream()
            .map(
                g ->
                    Map.of(
                        "word",
                        g,
                        "boards",
                        targets.stream()
                            .map(t -> Map.of("marks", marks(t, g), "solved", previous.contains(t)))
                            .toList()))
            .toList());
    response.put(
        "finished",
        db.one(
                "SELECT finished FROM word_game_session WHERE user_id=? AND challenge_key=?",
                a.id(),
                seed)
            .get("finished"));
    return response;
  }

  public record WordAttempt(
      @NotBlank String challengeKey,
      @NotBlank String mode,
      @Min(1) @Max(5) int difficulty,
      @NotBlank @Size(max = 32) String guess,
      @Size(max = 20) List<String> guesses,
      @Min(1) @Max(20) int attempt,
      boolean daily,
      @Min(0) int durationMs) {}

  @PostMapping("/words/attempt")
  @Transactional
  public Object wordAttempt(@AuthenticationPrincipal Actor a, @Valid @RequestBody WordAttempt r) {
    require(a);
    String mode = normalizeMode(r.mode());
    int d = Math.clamp(r.difficulty(), 1, 5);
    var session =
        db.one(
            "SELECT * FROM word_game_session WHERE user_id=? AND challenge_key=? FOR UPDATE",
            a.id(),
            r.challengeKey());
    if (!mode.equals(session.get("mode"))
        || d != ((Number) session.get("difficulty")).intValue()
        || r.daily() != (Boolean) session.get("daily"))
      throw ApiException.invalid("Desafio inválido.");
    if (Boolean.TRUE.equals(session.get("finished")))
      throw ApiException.invalid("Esta rodada já terminou. Inicie outra rodada.");
    String expectedKey = r.challengeKey();
    if (r.daily() && !expectedKey.startsWith(LocalDate.now(ZoneOffset.UTC).toString()))
      throw ApiException.invalid("Desafio diário expirado.");
    var targets = targets(expectedKey, mode, d);
    String guess = normalizeWord(r.guess());
    if (guess.length() != targets.getFirst().length())
      throw ApiException.invalid(
          "A palavra precisa ter " + targets.getFirst().length() + " letras.");
    if (WORDS.values().stream().flatMap(List::stream).noneMatch(guess::equals))
      throw ApiException.invalid(
          "Termo não encontrado. Consulte o vocabulário da rodada para escolher uma palavra"
              + " aceita.");
    List<String> previous =
        db.jdbc.queryForList(
            "SELECT unnest(guesses) FROM word_game_session WHERE user_id=? AND challenge_key=?",
            String.class,
            a.id(),
            expectedKey);
    if (previous.contains(guess)) throw ApiException.invalid("Você já tentou esta palavra.");
    Set<String> played = new HashSet<>(previous);
    played.add(guess);
    int attempt = previous.size() + 1;
    db.jdbc.update(
        "UPDATE word_game_session SET guesses=array_append(guesses,?) WHERE user_id=? AND"
            + " challenge_key=?",
        guess,
        a.id(),
        expectedKey);

    List<Map<String, Object>> boards = new ArrayList<>();
    boolean completed = true;
    for (String target : targets) {
      boolean solved = played.contains(target);
      completed &= solved;
      boards.add(Map.of("marks", marks(target, guess), "solved", solved));
    }
    int maxAttempts = mode.equals("QUARTET") ? 11 : mode.equals("DUET") ? 8 : 6;
    boolean finished = completed || attempt >= maxAttempts;

    if (finished) {
      db.jdbc.update(
          "UPDATE word_game_session SET finished=true WHERE user_id=? AND challenge_key=?",
          a.id(),
          expectedKey);
      db.jdbc.update(
          "INSERT INTO"
              + " word_game_result(id,user_id,challenge_key,mode,difficulty,attempts,won,daily,duration_ms)"
              + " VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,challenge_key) DO UPDATE SET"
              + " attempts=LEAST(word_game_result.attempts,EXCLUDED.attempts),won=word_game_result.won"
              + " OR EXCLUDED.won, duration_ms=CASE WHEN EXCLUDED.won THEN EXCLUDED.duration_ms"
              + " ELSE word_game_result.duration_ms END",
          UUID.randomUUID(),
          a.id(),
          expectedKey,
          mode,
          d,
          attempt,
          completed,
          r.daily(),
          r.durationMs());
      if (r.daily()) {
        db.jdbc.update(
            "INSERT INTO"
                + " daily_word_progress(user_id,challenge_date,mode,difficulty,attempts,completed,completed_at)"
                + " VALUES (?,?,?,?,?,?,CASE WHEN ? THEN now() END) ON"
                + " CONFLICT(user_id,challenge_date,mode) DO UPDATE SET"
                + " attempts=EXCLUDED.attempts,completed=daily_word_progress.completed OR"
                + " EXCLUDED.completed,"
                + " completed_at=coalesce(daily_word_progress.completed_at,EXCLUDED.completed_at)",
            a.id(),
            LocalDate.now(ZoneOffset.UTC),
            mode,
            d,
            attempt,
            completed,
            completed);
      }
      if (completed) {
        awardXp(
            a.id(),
            "word:" + expectedKey,
            25 + d * 10 + (mode.equals("QUARTET") ? 30 : mode.equals("DUET") ? 15 : 0));
        touchStreak(a.id());
      }
    }

    var response =
        new LinkedHashMap<String, Object>(
            Map.of(
                "boards", boards,
                "completed", completed,
                "finished", finished,
                "attempt", attempt,
                "maxAttempts", maxAttempts,
                "message",
                    completed
                        ? "Desafio concluído!"
                        : finished
                            ? "Fim da rodada. Tente um novo desafio."
                            : "Continue investigando."));
    if (finished) response.put("answers", targets);
    return response;
  }

  @GetMapping("/words/stats")
  public Object wordStats(@AuthenticationPrincipal Actor a) {
    require(a);
    return db.one(
        "SELECT count(*) games,count(*) FILTER(WHERE won) wins,coalesce(avg(attempts) FILTER(WHERE"
            + " won),0) average_attempts, coalesce(max(difficulty) FILTER(WHERE won),0)"
            + " max_difficulty FROM word_game_result WHERE user_id=?",
        a.id());
  }

  public record AlgorithmAttempt(
      @Min(1) @Max(100000) int level,
      @NotBlank @Size(max = 6000) String code,
      @Min(1) @Max(100) int attempts,
      @Min(0) int durationMs) {}

  @PostMapping("/algorithm/evaluate")
  @Transactional
  public Object algorithm(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody AlgorithmAttempt r) {
    require(a);
    var result = AlgorithmEngine.evaluate(r.code(), r.level());
    if (result.won()) {
      int stars =
          result.commands() <= optimal(r.level())
              ? 3
              : result.commands() <= optimal(r.level()) + 5 ? 2 : 1;
      db.jdbc.update(
          "INSERT INTO"
              + " algorithm_game_result(id,user_id,level,command_count,attempts,duration_ms,stars)"
              + " VALUES (?,?,?,?,?,?,?)",
          UUID.randomUUID(),
          a.id(),
          r.level(),
          result.commands(),
          r.attempts(),
          r.durationMs(),
          stars);
      awardXp(a.id(), "algorithm:" + r.level(), 35 + Math.min(r.level(), 20) * 8);
      touchStreak(a.id());
      return Map.of(
          "won",
          true,
          "stars",
          stars,
          "commands",
          result.commands(),
          "frames",
          result.frames(),
          "message",
          "Algoritmo concluído.");
    }
    return Map.of(
        "won",
        false,
        "stars",
        0,
        "commands",
        result.commands(),
        "frames",
        result.frames(),
        "message",
        result.message());
  }

  @GetMapping("/binary/challenge")
  public Object binaryChallenge(@AuthenticationPrincipal Actor a) {
    require(a);
    var challenge = binaryFor(a.id());
    var result = new LinkedHashMap<String, Object>();
    result.put("challengeKey", challenge.key());
    result.put("dayLevel", challenge.dayLevel());
    result.put("bitWidth", challenge.bitWidth());
    result.put("operation", challenge.operation());
    result.put("prompt", challenge.prompt());
    result.put("hint", challenge.hint());
    result.put("expression", challenge.expression());
    result.put("operands", challenge.operands());
    result.put("completedToday", challenge.completedToday());
    result.put("completedDays", challenge.completedDays());
    result.put("rewardXp", 40 + Math.min(challenge.dayLevel(), 30) * 3);
    return result;
  }

  public record BinaryAttempt(
      @NotBlank String challengeKey,
      @NotBlank @Pattern(regexp = "[01]{1,16}") String answer,
      @Min(0) int durationMs) {}

  @PostMapping("/binary/attempt")
  @Transactional
  public Object binaryAttempt(
      @AuthenticationPrincipal Actor a, @Valid @RequestBody BinaryAttempt r) {
    require(a);
    var challenge = binaryFor(a.id());
    if (!challenge.key().equals(r.challengeKey()))
      throw ApiException.invalid("O desafio binário mudou. Atualize o laboratório.");

    String normalized = r.answer().replaceFirst("^0+(?!$)", "");
    String expected = Integer.toBinaryString(challenge.expected());
    boolean correct = normalized.equals(expected);

    int xp = 0;
    if (correct && !challenge.completedToday()) {
      int reward = 40 + Math.min(challenge.dayLevel(), 30) * 3;
      xp = awardXp(a.id(), "binary-daily:" + LocalDate.now(ZoneOffset.UTC), reward);
      touchStreak(a.id());
    }

    var response = new LinkedHashMap<String, Object>();
    response.put("correct", correct);
    response.put("xpAwarded", xp);
    response.put("expectedBits", correct ? toBits(challenge.expected(), challenge.bitWidth()) : "");
    response.put(
        "message",
        correct
            ? challenge.completedToday()
                ? "Desafio de hoje já estava concluído. Volte amanhã para uma versão mais difícil."
                : "Circuito resolvido! Amanhã o laboratório aumenta a complexidade."
            : "Ainda não. Confira os bits e refaça a operação.");
    response.put("nextDayLevel", correct ? challenge.dayLevel() + 1 : challenge.dayLevel());
    return response;
  }

  private record BinaryChallenge(
      String key,
      int dayLevel,
      int bitWidth,
      String operation,
      String prompt,
      String hint,
      String expression,
      List<Map<String, Object>> operands,
      int expected,
      boolean completedToday,
      int completedDays) {}

  private BinaryChallenge binaryFor(UUID user) {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    String eventKey = "binary-daily:" + today;
    boolean completedToday =
        db.exists(
            "SELECT EXISTS(SELECT 1 FROM learning_xp_event WHERE user_id=? AND event_key=?)",
            user,
            eventKey);
    Integer count =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM learning_xp_event WHERE user_id=? AND event_key LIKE"
                + " 'binary-daily:%'",
            Integer.class, user);
    int completedDays = count == null ? 0 : count;
    int dayLevel = completedToday ? Math.max(1, completedDays) : completedDays + 1;
    int bitWidth = Math.min(12, 3 + dayLevel);
    int mask = (1 << bitWidth) - 1;
    Random random =
        new Random(Objects.hash(today.toString(), user.toString(), dayLevel, "enturma-binary"));

    String operation;
    String prompt;
    String hint;
    String expression;
    List<Map<String, Object>> operands = new ArrayList<>();
    int expected;

    if (dayLevel == 1) {
      int a = 1 + random.nextInt(mask);
      operation = "DECIMAL";
      prompt = "Monte em bits o número decimal " + a + ".";
      hint = "Cada chave representa uma potência de 2.";
      expression = Integer.toString(a);
      operands.add(binaryOperand("A", a, bitWidth));
      expected = a;
    } else if (dayLevel == 2) {
      int a = random.nextInt(Math.max(2, mask / 2));
      int b = 1 + random.nextInt(Math.max(2, mask / 2));
      operation = "ADD";
      prompt = "Some A + B e monte o resultado em binário.";
      hint = "Faça a soma decimal ou binária e respeite a largura do circuito.";
      expression = "A + B";
      operands.add(binaryOperand("A", a, bitWidth));
      operands.add(binaryOperand("B", b, bitWidth));
      expected = (a + b) & mask;
    } else if (dayLevel == 3) {
      int a = random.nextInt(mask + 1);
      int b = random.nextInt(mask + 1);
      operation = "XOR";
      prompt = "Resolva A XOR B e ligue os bits do resultado.";
      hint = "No XOR, o bit vale 1 quando os dois bits são diferentes.";
      expression = "A XOR B";
      operands.add(binaryOperand("A", a, bitWidth));
      operands.add(binaryOperand("B", b, bitWidth));
      expected = (a ^ b) & mask;
    } else if (dayLevel == 4) {
      int a = random.nextInt(mask + 1);
      int b = random.nextInt(mask + 1);
      int c = random.nextInt(mask + 1);
      operation = "LOGIC";
      prompt = "Resolva (A AND B) OR C.";
      hint = "Faça o AND primeiro e depois aplique OR ao resultado.";
      expression = "(A AND B) OR C";
      operands.add(binaryOperand("A", a, bitWidth));
      operands.add(binaryOperand("B", b, bitWidth));
      operands.add(binaryOperand("C", c, bitWidth));
      expected = ((a & b) | c) & mask;
    } else if (dayLevel == 5) {
      int a = random.nextInt(mask + 1);
      int shift = 1 + random.nextInt(Math.min(3, bitWidth - 1));
      int b = random.nextInt(mask + 1);
      operation = "SHIFT";
      prompt = "Desloque A para a esquerda e depois aplique XOR com B.";
      hint = "O deslocamento << move todos os bits e preenche com zero à direita.";
      expression = "(A << " + shift + ") XOR B";
      operands.add(binaryOperand("A", a, bitWidth));
      operands.add(binaryOperand("B", b, bitWidth));
      expected = ((a << shift) ^ b) & mask;
    } else {
      int operandCount = Math.min(5, 3 + Math.max(0, dayLevel - 6) / 3);
      int value = random.nextInt(mask + 1);
      operands.add(binaryOperand("A", value, bitWidth));
      StringBuilder expr = new StringBuilder("A");
      for (int i = 1; i < operandCount; i++) {
        int operand = random.nextInt(mask + 1);
        String label = String.valueOf((char) ('A' + i));
        operands.add(binaryOperand(label, operand, bitWidth));
        if (i % 2 == 1) {
          value = (value ^ operand) & mask;
          expr.insert(0, "(").append(" XOR ").append(label).append(")");
        } else {
          value = (value + operand) & mask;
          expr.insert(0, "(").append(" + ").append(label).append(")");
        }
      }
      operation = "PIPELINE";
      prompt = "Resolva a expressão em etapas e monte o resultado final.";
      hint =
          "Trabalhe da esquerda para a direita respeitando os parênteses. O circuito mantém apenas "
              + bitWidth
              + " bits.";
      expression = expr.toString();
      expected = value;
    }

    return new BinaryChallenge(
        today + ":" + dayLevel + ":" + operation,
        dayLevel,
        bitWidth,
        operation,
        prompt,
        hint,
        expression,
        operands,
        expected,
        completedToday,
        completedDays);
  }

  private Map<String, Object> binaryOperand(String label, int value, int bits) {
    return Map.of(
        "label", label,
        "decimal", value,
        "binary", toBits(value, bits));
  }

  private String toBits(int value, int bits) {
    String raw = Integer.toBinaryString(value);
    return "0".repeat(Math.max(0, bits - raw.length())) + raw;
  }

  private int optimal(int level) {
    return 10;
  }

  @GetMapping("/algorithm/challenge")
  public Object algorithmChallenge(
      @AuthenticationPrincipal Actor a, @RequestParam(defaultValue = "1") int level) {
    require(a);
    if (level < 1 || level > 100000) throw ApiException.invalid("Nível inválido.");
    return Map.of(
        "level",
        level,
        "walls",
        AlgorithmEngine.walls(level),
        "size",
        6,
        "goal",
        35,
        "maxMoves",
        100);
  }

  private String normalizeMode(String mode) {
    String value = mode == null ? "SOLO" : mode.toUpperCase(Locale.ROOT);
    if (!Set.of("SOLO", "DUET", "QUARTET").contains(value))
      throw ApiException.invalid("Modo inválido.");
    return value;
  }

  private String normalizeWord(String value) {
    return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z]", "");
  }

  private List<String> targets(String seed, String mode, int difficulty) {
    List<String> pool = WORDS.get(difficulty);
    int count = mode.equals("QUARTET") ? 4 : mode.equals("DUET") ? 2 : 1;
    Map<Integer, List<String>> byLength = new LinkedHashMap<>();
    for (String word : pool)
      byLength.computeIfAbsent(word.length(), ignored -> new ArrayList<>()).add(word);
    List<List<String>> eligible =
        byLength.values().stream().filter(group -> group.size() >= count).toList();
    if (eligible.isEmpty()) throw new IllegalStateException("Banco de palavras insuficiente.");
    List<String> compatible = eligible.get(Math.floorMod(seed.hashCode(), eligible.size()));
    List<String> ordered = new ArrayList<>(compatible);
    Collections.shuffle(ordered, new Random(Objects.hash(seed, difficulty)));
    return new ArrayList<>(ordered.subList(0, count));
  }

  private String marks(String target, String guess) {
    char[] out = new char[target.length()];
    int[] remaining = new int[26];
    Arrays.fill(out, 'A');
    for (int i = 0; i < target.length(); i++) {
      if (guess.charAt(i) == target.charAt(i)) out[i] = 'C';
      else remaining[target.charAt(i) - 'A']++;
    }
    for (int i = 0; i < target.length(); i++) {
      if (out[i] == 'C') continue;
      int index = guess.charAt(i) - 'A';
      if (index >= 0 && index < 26 && remaining[index] > 0) {
        out[i] = 'P';
        remaining[index]--;
      }
    }
    return new String(out);
  }

  private int awardXp(UUID user, String key, int amount) {
    db.jdbc.update("INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", user);
    int inserted =
        db.jdbc.update(
            "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES (?,?,?,?,?)"
                + " ON CONFLICT(user_id,event_key) DO NOTHING",
            UUID.randomUUID(),
            user,
            key,
            amount,
            "ADVANCED_GAME");
    if (inserted == 1)
      db.jdbc.update(
          "UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?",
          amount,
          user);
    return inserted == 1 ? amount : 0;
  }

  private void touchStreak(UUID user) {
    db.jdbc.update("INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", user);
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    var stats =
        db.one(
            "SELECT current_streak,last_active_date FROM learning_stats WHERE user_id=? FOR UPDATE",
            user);
    Object rawLast = stats.get("lastActiveDate");
    LocalDate last = rawLast == null ? null : LocalDate.parse(rawLast.toString());
    if (today.equals(last)) return;
    int current = ((Number) stats.get("currentStreak")).intValue();
    int next = last != null && last.equals(today.minusDays(1)) ? current + 1 : 1;
    db.jdbc.update(
        "UPDATE learning_stats SET current_streak=?,longest_streak=greatest(longest_streak,?),"
            + " last_active_date=?,updated_at=now() WHERE user_id=?",
        next,
        next,
        today,
        user);
  }
}
