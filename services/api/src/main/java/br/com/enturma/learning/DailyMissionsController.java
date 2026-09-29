package br.com.enturma.learning;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/learning/missions")
public class DailyMissionsController {
  private final Db db;
  private final LearningController learning;
  private final ObjectMapper json;
  private static final List<String> GAMES = List.of("words", "algorithm", "binary", "trace");
  // Definitions, not answers, are sent to the browser. The seed and secret stay on the server.
  private static final String[][] WORDS = {
    {"ARRAY", "Estrutura que guarda uma sequência de elementos acessíveis por índice."},
    {"CACHE", "Armazenamento temporário usado para acelerar acessos repetidos."},
    {"LOOP", "Estrutura de controle que repete instruções enquanto uma condição permite."},
    {"STACK", "Estrutura na qual o último elemento inserido é o primeiro a sair."},
    {"QUEUE", "Estrutura que atende os elementos na ordem em que chegaram."},
    {"CLASS", "Modelo que reúne atributos e comportamentos de objetos."},
    {"TOKEN", "Unidade usada na análise de código ou como credencial de acesso."},
    {"DEBUG", "Investigar a execução de um programa para localizar defeitos."},
    {"QUERY", "Solicitação de dados feita a um banco ou mecanismo de busca."},
    {"BINARY", "Sistema de representação que utiliza apenas dois símbolos."},
    {"STRING", "Sequência de caracteres usada para representar texto."},
    {"RETURN", "Instrução que encerra uma função e pode entregar um valor."},
    {"METHOD", "Comportamento definido dentro de uma classe ou objeto."},
    {"OBJECT", "Entidade que reúne estado e comportamento."},
    {"THREAD", "Fluxo de execução que pode compartilhar recursos com outros fluxos."},
    {"BUFFER", "Área temporária que acomoda dados durante uma transferência."},
    {"CLOSURE", "Função que mantém acesso ao ambiente em que foi criada."},
    {"PROMISE", "Representação de um resultado assíncrono que ainda pode estar pendente."},
    {"COMPILER", "Programa que traduz uma linguagem de programação em outra representação."},
    {
      "RECURSION",
      "Técnica na qual uma função resolve partes menores do problema chamando a si mesma."
    },
    {"DEADLOCK", "Situação em que tarefas ficam esperando recursos umas das outras sem progredir."},
    {"CHECKSUM", "Valor calculado para detectar alterações acidentais em dados."},
    {
      "POLYMORPHISM",
      "Capacidade de uma mesma interface representar comportamentos de tipos diferentes."
    },
    {"MEMOIZATION", "Otimização que guarda resultados de chamadas para evitar cálculos repetidos."},
    {"IDEMPOTENT", "Propriedade de uma operação cujo efeito não muda quando repetida."},
    {"SERIALIZE", "Converter uma estrutura de dados em um formato armazenável ou transmissível."},
    {"SEMAPHORE", "Mecanismo que controla quantas tarefas podem acessar um recurso."},
    {"INHERITANCE", "Relação na qual um tipo recebe características de outro."},
    {"ENCAPSULATION", "Princípio de esconder detalhes internos e expor uma interface controlada."},
    {"TRANSACTION", "Conjunto de operações tratado como uma unidade consistente."}
  };

  public DailyMissionsController(Db db, LearningController learning, ObjectMapper json) {
    this.db = db;
    this.learning = learning;
    this.json = json;
  }

  private void require(Actor a) {
    if (!learning.eligible(a)) throw ApiException.forbidden();
  }

  static LocalDate today() {
    return LocalDate.now(ZoneId.of("America/Sao_Paulo"));
  }

  private String encode(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  @GetMapping
  @Transactional
  public Object daily(@AuthenticationPrincipal Actor a) {
    require(a);
    LocalDate date = today();
    db.jdbc.update(
        "INSERT INTO learning_mission_start(user_id,started_on) VALUES (?,?) ON CONFLICT DO"
            + " NOTHING",
        a.id(),
        date);
    String start =
        (String)
            db.one("SELECT started_on FROM learning_mission_start WHERE user_id=?", a.id())
                .get("startedOn");
    int difficulty =
        (int) Math.min(10000, ChronoUnit.DAYS.between(LocalDate.parse(start), date) + 1);
    for (String game : GAMES)
      for (int slot = 1; slot <= 5; slot++)
        db.jdbc.update(
            "INSERT INTO learning_mission(user_id,mission_date,game,slot,difficulty,definition)"
                + " VALUES (?,?,?,?,?,?::jsonb) ON CONFLICT DO NOTHING",
            a.id(),
            date,
            game,
            slot,
            difficulty,
            encode(definition(a.id(), date, game, slot, difficulty)));
    var rows =
        db.list(
            "SELECT game,slot,difficulty,definition,attempts,history,completed,won FROM"
                + " learning_mission WHERE user_id=? AND mission_date=? ORDER BY game,slot",
            a.id(),
            date);
    rows.forEach(
        r -> {
          var d = (com.fasterxml.jackson.databind.node.ObjectNode) r.get("definition");
          d.remove(List.of("answer", "word", "seed"));
        });
    return Map.of("date", date.toString(), "difficulty", difficulty, "missions", rows);
  }

  private Map<String, Object> definition(
      UUID user, LocalDate day, String game, int slot, int difficulty) {
    int tier = Math.min(12, difficulty);
    Random random = new Random(Objects.hash(user, day, game, slot));
    var d = new LinkedHashMap<String, Object>();
    if (game.equals("words")) {
      int base = Math.min(WORDS.length - 10, (tier - 1) * 2);
      int index =
          base
              + Math.floorMod(
                  Objects.hash(user, day, "word") + slot * 7, Math.min(10, WORDS.length - base));
      var word = WORDS[index];
      d.put("word", word[0]);
      d.put("hint", word[1]);
      d.put("length", word[0].length());
      d.put("maxAttempts", 6);
      d.put("language", "Termo técnico em inglês");
    } else if (game.equals("algorithm")) {
      int seed = 1 + Math.floorMod(Objects.hash(day, user, slot), 99999);
      d.put("seed", seed);
      d.put("walls", AlgorithmEngine.walls(seed));
      d.put(
          "hint",
          "Planeje o caminho até o canto inferior direito. Desvie dos blocos e use repeat para"
              + " repetir movimentos.");
      d.put("budget", Math.max(10, 24 - tier));
    } else if (game.equals("binary")) {
      int width = Math.min(12, 4 + tier / 2),
          max = (1 << width) - 1,
          a = random.nextInt(max / 2) + 1,
          b = random.nextInt(max / 2) + 1,
          result;
      String expression, hint;
      if (tier == 1) {
        result = a;
        expression = "decimal " + a;
        hint = "Converta o número decimal para binário. Cada posição vale uma potência de 2.";
      } else if (tier < 4) {
        result = a + b;
        expression = a + " + " + b;
        hint = "Some os valores e represente o resultado em binário.";
      } else if (tier < 7) {
        result = a ^ b;
        expression = a + " XOR " + b;
        hint = "No XOR, cada bit vale 1 quando os bits de entrada são diferentes.";
      } else {
        result = ((a << 1) ^ b) & max;
        expression = "((" + a + " << 1) XOR " + b + ") AND " + max;
        hint = "Desloque A um bit à esquerda, aplique XOR e mantenha apenas os bits da máscara.";
      }
      d.put("width", width);
      d.put("expression", expression);
      d.put("hint", hint);
      d.put("answer", Integer.toBinaryString(result));
    } else {
      int n = 3 + random.nextInt(3) + tier,
          m = 2 + random.nextInt(4),
          initial = random.nextInt(5),
          result;
      String code, hint;
      if (tier < 3) {
        result = initial + n * (n + 1) / 2;
        code =
            "let total = "
                + initial
                + ";\nfor (let i = 1; i <= "
                + n
                + "; i++) {\n  total += i;\n}\nconsole.log(total);";
        hint = "Anote o valor inicial e acompanhe cada atualização de total.";
      } else if (tier < 6) {
        result = n * m;
        code =
            "const values = ["
                + (n - 2)
                + ", "
                + (n - 1)
                + ", "
                + n
                + "];\nconst result = values.map(v => v * "
                + m
                + ");\nconsole.log(result[2]);";
        hint = "O índice 2 aponta para o terceiro elemento. map transforma cada valor.";
      } else {
        result = 0;
        for (int i = 1; i <= n; i++) if (i % 2 == 0) result += i * m;
        code =
            "let total = 0;\nfor (let i = 1; i <= "
                + n
                + "; i++) {\n  if (i % 2 === 0) total += i * "
                + m
                + ";\n}\nconsole.log(total);";
        hint = "O operador % calcula o resto. Descubra quais iterações passam pela condição.";
      }
      d.put("code", code);
      d.put("hint", hint);
      d.put("answer", String.valueOf(result));
    }
    return d;
  }

  public record Attempt(
      @NotBlank String date,
      @NotBlank String game,
      @Min(1) @Max(5) int slot,
      @NotNull @Size(max = 6000) String answer) {}

  @PostMapping
  @Transactional
  public Object attempt(@AuthenticationPrincipal Actor a, @Valid @RequestBody Attempt input) {
    require(a);
    if (!input.date().equals(today().toString()) || !GAMES.contains(input.game()))
      throw ApiException.invalid("As missões mudaram. Atualize para jogar as de hoje.");
    var row =
        db.one(
            "SELECT * FROM learning_mission WHERE user_id=? AND mission_date=? AND game=? AND"
                + " slot=? FOR UPDATE",
            a.id(),
            today(),
            input.game(),
            input.slot());
    if (Boolean.TRUE.equals(row.get("completed")))
      throw ApiException.invalid("Missão concluída. Escolha a próxima missão.");
    if (input.slot() > 1
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM learning_mission WHERE user_id=? AND mission_date=? AND"
                + " game=? AND slot=? AND completed)",
            a.id(),
            today(),
            input.game(),
            input.slot() - 1)) throw ApiException.invalid("Conclua a missão anterior primeiro.");
    JsonNode d = (JsonNode) row.get("definition");
    var history = (com.fasterxml.jackson.databind.node.ArrayNode) row.get("history");
    boolean won = false, completed = false;
    String message = "Ainda não. Use a dica e tente novamente.";
    Object frames = List.of();
    String answer = input.answer().strip();
    if (input.game().equals("words")) {
      answer =
          java.text.Normalizer.normalize(answer, java.text.Normalizer.Form.NFD)
              .replaceAll("\\p{M}", "")
              .toUpperCase(Locale.ROOT);
      String word = d.path("word").asText();
      if (!answer.matches("[A-Z]{" + word.length() + "}"))
        throw ApiException.invalid(
            "Digite " + word.length() + " letras. A palavra é um termo técnico em inglês.");
      for (var h : history)
        if (h.path("word").asText().equals(answer))
          throw ApiException.invalid("Você já tentou essa palavra. Experimente outra.");
      String marks = marks(word, answer);
      history.add(json.valueToTree(Map.of("word", answer, "marks", marks)));
      won = answer.equals(word);
      completed = won || history.size() >= 6;
      message =
          won
              ? "Você descobriu o conceito!"
              : "Use as cores e a definição para ajustar sua hipótese.";
      if (completed && !won)
        message =
            "Rodada concluída. A definição continua disponível para você pesquisar e revisar o"
                + " conceito.";
    } else if (input.game().equals("algorithm")) {
      var result = AlgorithmEngine.evaluate(answer, d.path("seed").asInt());
      frames = result.frames();
      won = result.won() && result.commands() <= d.path("budget").asInt();
      message =
          result.won() && !won
              ? "Você chegou! Agora reduza os movimentos para o limite desta missão."
              : result.message();
      completed = won;
    } else if (input.game().equals("binary")) {
      if (!answer.matches("[01]{1,12}")) throw ApiException.invalid("Digite apenas 0 e 1.");
      won = answer.replaceFirst("^0+(?!$)", "").equals(d.path("answer").asText());
      completed = won;
    } else {
      won = answer.equals(d.path("answer").asText());
      completed = won;
    }
    if (won) message = "Missão concluída! Seu progresso foi salvo.";
    db.jdbc.update(
        "UPDATE learning_mission SET attempts=attempts+1,history=?::jsonb,completed=?,won=? WHERE"
            + " user_id=? AND mission_date=? AND game=? AND slot=?",
        encode(history),
        completed,
        won,
        a.id(),
        today(),
        input.game(),
        input.slot());
    if (completed) {
      db.jdbc.update(
          "INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", a.id());
      int xp = won ? 25 + Math.min(25, ((Number) row.get("difficulty")).intValue()) : 5;
      int inserted =
          db.jdbc.update(
              "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES (?,?,?,?,?)"
                  + " ON CONFLICT DO NOTHING",
              UUID.randomUUID(),
              a.id(),
              "mission:" + today() + ":" + input.game() + ":" + input.slot(),
              xp,
              "DAILY_MISSION");
      if (inserted == 1)
        db.jdbc.update(
            "UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?",
            xp,
            a.id());
    }
    return Map.of(
        "won",
        won,
        "completed",
        completed,
        "message",
        message,
        "history",
        history,
        "frames",
        frames);
  }

  static String marks(String word, String guess) {
    char[] marks = new char[word.length()];
    Arrays.fill(marks, 'A');
    var remaining = new HashMap<Character, Integer>();
    for (int i = 0; i < word.length(); i++)
      if (word.charAt(i) == guess.charAt(i)) marks[i] = 'C';
      else remaining.merge(word.charAt(i), 1, Integer::sum);
    for (int i = 0; i < word.length(); i++)
      if (marks[i] != 'C' && remaining.getOrDefault(guess.charAt(i), 0) > 0) {
        marks[i] = 'P';
        remaining.merge(guess.charAt(i), -1, Integer::sum);
      }
    return new String(marks);
  }
}
