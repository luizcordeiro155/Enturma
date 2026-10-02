package br.com.enturma.learning;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.*;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@org.springframework.boot.sql.init.dependency.DependsOnDatabaseInitialization
@RestController
@RequestMapping("/api/v1/learning/academic")
public class AcademicGames {
  record Game(String code, String area, String title, String template, String subjectPattern) {}

  static final List<Game> REGISTRY =
      List.of(
          new Game(
              "logic-trace",
              "IT",
              "Rastreamento lógico",
              "TRACE",
              "algoritm|programacao|computacao|logica"),
          new Game(
              "dose-lab",
              "NURSING",
              "Laboratório de proporções",
              "DOSE",
              "farmac|dosagem|enfermagem"),
          new Game(
              "anatomy-map",
              "NURSING",
              "Mapa da anatomia",
              "ANATOMY",
              "anatom|morfo|corpo humano|biolog"),
          new Game(
              "care-order",
              "NURSING",
              "Organização de protocolos",
              "PROTOCOL",
              "enfermagem|cuidado|saude coletiva"),
          new Game(
              "vital-record",
              "NURSING",
              "Leitura de registros",
              "RECORD",
              "enfermagem|semiolog|saude"),
          new Game(
              "triage-lab",
              "NURSING",
              "Fila de prioridade simulada",
              "PRIORITY",
              "enfermagem|urgencia|emergencia"),
          new Game(
              "cash-flow", "BUSINESS", "Fluxo de caixa", "CASH", "finance|contab|administr|gestao"),
          new Game("cost-sort", "BUSINESS", "Custos em contexto", "COST", "custo|contab|econom"),
          new Game(
              "project-plan",
              "BUSINESS",
              "Planejamento de projetos",
              "PLAN",
              "projeto|planeja|administr|gestao"),
          new Game(
              "decision-lab",
              "BUSINESS",
              "Cenários de decisão",
              "DECISION",
              "estrateg|administr|gestao"),
          new Game(
              "law-powers", "LAW", "Conceitos constitucionais", "LAW", "constituc|direito|jurid"),
          new Game(
              "law-principle",
              "LAW",
              "Princípios em cenário",
              "PRINCIPLE",
              "constituc|direito|jurid"),
          new Game(
              "units-lab",
              "ENGINEERING",
              "Oficina de unidades",
              "UNITS",
              "fisic|mecan|eletric|calculo"),
          new Game(
              "circuit-lab",
              "ENGINEERING",
              "Circuitos resistivos",
              "CIRCUIT",
              "circuit|eletric|eletron|fisic"),
          new Game(
              "formula-lab",
              "ENGINEERING",
              "Fórmulas em movimento",
              "FORMULA",
              "fisic|mecan|calculo"),
          new Game(
              "ux-audit",
              "DESIGN",
              "Detetive de acessibilidade",
              "ACCESS",
              "design|interface|usabilidade|interacao|acessib"),
          new Game(
              "ux-flow",
              "DESIGN",
              "Fluxos de interface",
              "FLOW",
              "design|interface|usabilidade|interacao"),
          new Game(
              "ux-heuristic",
              "DESIGN",
              "Heurísticas em prática",
              "HEURISTIC",
              "design|interface|usabilidade|interacao"));
  private final Db db;
  private final ObjectMapper json;

  public AcademicGames(Db db, ObjectMapper json) {
    this.db = db;
    this.json = json;
  }

  @PostConstruct
  public void register() {
    for (var g : REGISTRY)
      db.jdbc.update(
          "INSERT INTO academic_game_definition(code,category,title,template) VALUES (?,?,?,?) ON"
              + " CONFLICT(code) DO UPDATE SET"
              + " category=EXCLUDED.category,title=EXCLUDED.title,template=EXCLUDED.template",
          g.code,
          g.area,
          g.title,
          g.template);
  }

  private List<Map<String, Object>> subjects(Actor a) {
    return db.list(
        "SELECT s.id,s.name,s.normalized_name FROM user_subject us JOIN academic_entry s ON"
            + " s.id=us.subject_id WHERE us.user_id=? AND s.status='VERIFIED' AND EXISTS(SELECT 1"
            + " FROM academic_enrollment e WHERE e.user_id=us.user_id) AND NOT EXISTS(WITH"
            + " RECURSIVE chain AS (SELECT id,parent_id,status FROM academic_entry WHERE id=s.id"
            + " UNION ALL SELECT p.id,p.parent_id,p.status FROM academic_entry p JOIN chain c ON"
            + " p.id=c.parent_id) SELECT 1 FROM chain WHERE status<>'VERIFIED') ORDER BY s.name",
        a.id());
  }

  @GetMapping
  @Transactional
  public Object list(@AuthenticationPrincipal Actor a) {
    var result = new ArrayList<Map<String, Object>>();
    for (var s : subjects(a)) {
      for (var g : REGISTRY)
        if (((String) s.get("normalizedName")).matches(".*(" + g.subjectPattern + ").*")) {
          db.jdbc.update(
              "INSERT INTO academic_game_assignment(subject_id,game_code) VALUES (?,?) ON CONFLICT"
                  + " DO NOTHING",
              s.get("id"),
              g.code);
          result.add(
              Map.of(
                  "subjectId",
                  s.get("id"),
                  "subject",
                  s.get("name"),
                  "code",
                  g.code,
                  "title",
                  g.title,
                  "category",
                  g.area,
                  "template",
                  g.template));
        }
    }
    return result;
  }

  private Game require(Actor a, UUID subject, String code) {
    Game g =
        REGISTRY.stream()
            .filter(x -> x.code.equals(code))
            .findFirst()
            .orElseThrow(ApiException::missing);
    if (subjects(a).stream()
        .noneMatch(
            s ->
                s.get("id").equals(subject)
                    && ((String) s.get("normalizedName"))
                        .matches(".*(" + g.subjectPattern + ").*"))) throw ApiException.forbidden();
    return g;
  }

  private static LocalDate today() {
    return LocalDate.now(ZoneId.of("America/Sao_Paulo"));
  }

  public record Start(
      @NotNull UUID subjectId, @NotBlank String game, boolean daily, @Min(1) @Max(5) int slot) {}

  @PostMapping("/start")
  @Transactional
  public Object start(@AuthenticationPrincipal Actor a, @Valid @RequestBody Start input) {
    var g = require(a, input.subjectId, input.game);
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", a.id());
    if (input.daily) {
      var existing =
          db.list(
              "SELECT * FROM academic_game_progress WHERE user_id=? AND subject_id=? AND"
                  + " game_code=? AND challenge_date=? AND slot=? AND daily",
              a.id(),
              input.subjectId,
              g.code,
              today(),
              input.slot);
      if (!existing.isEmpty()) return publicView(existing.getFirst());
    }
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM academic_game_progress WHERE user_id=? AND challenge_date=?",
            Integer.class,
            a.id(),
            today())
        >= 200)
      throw ApiException.invalid(
          "Limite de novas atividades do dia atingido. Continue as atividades já iniciadas.");
    int days =
        db.jdbc.queryForObject(
            "SELECT count(DISTINCT challenge_date) FROM academic_game_progress WHERE user_id=? AND"
                + " completed_at IS NOT NULL AND challenge_date<?",
            Integer.class,
            a.id(),
            today());
    int difficulty = Math.min(10, 1 + days / 2);
    UUID id = UUID.randomUUID();
    var definition =
        ChallengeTemplates.generate(
            g.template, difficulty, new Random(id.getMostSignificantBits()));
    try {
      db.jdbc.update(
          "INSERT INTO"
              + " academic_game_progress(id,user_id,subject_id,game_code,challenge_date,slot,daily,difficulty,definition)"
              + " VALUES (?,?,?,?,?,?,?,?,?::jsonb)",
          id,
          a.id(),
          input.subjectId,
          g.code,
          today(),
          input.slot,
          input.daily,
          difficulty,
          json.writeValueAsString(definition));
    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
      throw new IllegalStateException(e);
    }
    return publicView(db.one("SELECT * FROM academic_game_progress WHERE id=?", id));
  }

  @GetMapping("/progress")
  public Object progress(@AuthenticationPrincipal Actor a) {
    return db.list(
        "SELECT id,subject_id,game_code,challenge_date,slot,daily,difficulty,attempts,completed_at"
            + " FROM academic_game_progress WHERE user_id=? AND challenge_date=? ORDER BY"
            + " game_code,slot",
        a.id(),
        today());
  }

  private Object publicView(Map<String, Object> row) {
    JsonNode d = (JsonNode) row.get("definition");
    return Map.of(
        "id",
        row.get("id"),
        "difficulty",
        row.get("difficulty"),
        "attempts",
        row.get("attempts"),
        "completed",
        row.get("completedAt") != null,
        "prompt",
        d.path("prompt").asText(),
        "hint",
        d.path("hint").asText(),
        "context",
        d.path("context").asText(),
        "source",
        d.path("source").asText(),
        "template",
        d.path("template").asText());
  }

  public record Answer(@NotBlank @Size(max = 500) String answer) {}

  @PostMapping("/{id}/answer")
  @Transactional
  public Object answer(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Answer input) {
    var row =
        db.one(
            "SELECT * FROM academic_game_progress WHERE id=? AND user_id=? FOR UPDATE", id, a.id());
    require(a, (UUID) row.get("subjectId"), (String) row.get("gameCode"));
    if (row.get("completedAt") != null)
      return Map.of("correct", true, "xpAwarded", 0, "message", "Atividade já concluída.");
    if (Boolean.TRUE.equals(row.get("daily"))
        && !today().toString().equals(row.get("challengeDate")))
      throw ApiException.invalid("Esta missão terminou. Abra as missões de hoje.");
    if (((Number) row.get("attempts")).intValue() >= 30)
      throw ApiException.invalid(
          "Limite de tentativas atingido. Revise o assunto e pratique outro desafio.");
    var d = (JsonNode) row.get("definition");
    boolean correct = ChallengeTemplates.matches(input.answer, d.path("answer").asText());
    db.jdbc.update(
        "UPDATE academic_game_progress SET attempts=attempts+1,completed_at=CASE WHEN ? THEN now()"
            + " ELSE NULL END WHERE id=?",
        correct,
        id);
    int xp = 0;
    if (correct) {
      db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", a.id());
      db.jdbc.update(
          "INSERT INTO learning_stats(user_id) VALUES (?) ON CONFLICT DO NOTHING", a.id());
      // Daily slots are rewarded once per game and date, including when bound to multiple subjects.
      String key =
          "academic:"
              + today()
              + ":"
              + row.get("gameCode")
              + ":"
              + (Boolean.TRUE.equals(row.get("daily")) ? "daily:" + row.get("slot") : "practice");
      int amount =
          Boolean.TRUE.equals(row.get("daily"))
              ? 20 + 5 * ((Number) row.get("difficulty")).intValue()
              : 10;
      if (db.jdbc.update(
              "INSERT INTO learning_xp_event(id,user_id,event_key,amount,reason) VALUES"
                  + " (?,?,?,?,'ACADEMIC') ON CONFLICT(user_id,event_key) DO NOTHING",
              UUID.randomUUID(),
              a.id(),
              key,
              amount)
          > 0) {
        xp = amount;
        db.jdbc.update(
            "UPDATE learning_stats SET total_xp=total_xp+?,updated_at=now() WHERE user_id=?",
            xp,
            a.id());
      }
      var stats = db.one("SELECT * FROM learning_stats WHERE user_id=? FOR UPDATE", a.id());
      String last = (String) stats.get("lastActiveDate");
      if (!today().toString().equals(last)) {
        int next =
            today().minusDays(1).toString().equals(last)
                ? ((Number) stats.get("currentStreak")).intValue() + 1
                : 1;
        db.jdbc.update(
            "UPDATE learning_stats SET"
                + " current_streak=?,longest_streak=greatest(longest_streak,?),last_active_date=?"
                + " WHERE user_id=?",
            next,
            next,
            today(),
            a.id());
      }
    }
    return Map.of(
        "correct",
        correct,
        "xpAwarded",
        xp,
        "message",
        correct
            ? "Muito bem! " + d.path("explanation").asText()
            : "Revise o raciocínio. " + d.path("hint").asText());
  }

  static String normalize(String value) {
    return java.text.Normalizer.normalize(
            value.strip().toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .replace(',', '.')
        .replaceAll("[ .]+$", "")
        .replaceAll("\\s+", " ");
  }
}
