package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class AiService {
  private final Db db;
  private final StudyService study;
  private final AiProvider provider;

  public AiService(Db db, StudyService study, AiProvider provider) {
    this.db = db;
    this.study = study;
    this.provider = provider;
  }

  public Object ask(Actor a, UUID room, String question, String mode) {
    study.member(a, room);
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM study_room WHERE id=? AND status IN ('OPEN','ACTIVE') AND"
            + " ends_at>now())",
        room)) throw new ApiException(409, "ROOM_ENDED", "Esta sessão já terminou.");

    boolean research = mode.equals("RESEARCH");
    if (!Set.of(
            "QUESTION", "SUMMARY", "FLASHCARDS", "QUIZ", "SIMPLIFY", "STUDY_PLAN", "RESEARCH")
        .contains(mode)) throw ApiException.invalid("Modo inválido.");

    if (!provider.enabled())
      throw new ApiException(503, "AI_UNAVAILABLE", "A Enturma AI ainda não está disponível.");
    if (research && !provider.webSearchEnabled())
      throw new ApiException(
          503, "AI_RESEARCH_UNAVAILABLE", "A pesquisa externa da Enturma AI não está habilitada.");

    int used =
        db.jdbc.queryForObject(
            "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+interval '1 day') ON"
                + " CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limit.resets_at<now() THEN 1"
                + " ELSE rate_limit.hits+1 END,resets_at=CASE WHEN rate_limit.resets_at<now() THEN"
                + " now()+interval '1 day' ELSE rate_limit.resets_at END RETURNING hits",
            Integer.class,
            "ai:" + a.id());
    if (used > 30)
      throw new ApiException(429, "AI_LIMIT", "Você atingiu o limite diário da Enturma AI.");

    var chunks =
        db.list(
            "SELECT c.id,c.body,c.page,m.id material_id,m.file_name FROM material_chunk c JOIN"
                + " study_material m ON m.id=c.material_id WHERE c.room_id=? AND m.status='READY'"
                + " AND (? NOT IN ('QUESTION','RESEARCH') OR c.search @@"
                + " plainto_tsquery('portuguese',?)) ORDER BY"
                + " ts_rank(c.search,plainto_tsquery('portuguese',?)) DESC,c.ordinal,c.id LIMIT 10",
            room,
            mode,
            question,
            question);

    if (chunks.isEmpty() && !research)
      return Map.of(
          "answer",
          "Não encontrei essa informação nos materiais desta sessão.",
          "sources",
          List.of(),
          "webSources",
          List.of());

    StringBuilder context = new StringBuilder();
    List<Map<String, Object>> sources = new ArrayList<>();
    for (int i = 0; i < chunks.size(); i++) {
      var c = chunks.get(i);
      context
          .append("[")
          .append(i + 1)
          .append("] ")
          .append(c.get("fileName"))
          .append(c.get("page") == null ? "" : " (página " + c.get("page") + ")")
          .append("\n")
          .append(c.get("body"))
          .append("\n");
      var source = new LinkedHashMap<String, Object>();
      source.put("number", i + 1);
      source.put("materialId", c.get("materialId"));
      source.put("fileName", c.get("fileName"));
      source.put("page", c.get("page"));
      source.put("excerpt", c.get("body"));
      sources.add(source);
    }

    AiProvider.Answer result = provider.answer(context.toString(), question, mode, research);
    study.member(a, room);
    db.jdbc.update(
        "INSERT INTO ai_message(id,room_id,user_id,question,answer) VALUES (?,?,?,?,?)",
        UUID.randomUUID(),
        room,
        a.id(),
        question,
        result.text());

    return Map.of(
        "answer",
        result.text(),
        "sources",
        sources,
        "webSources",
        result.sources());
  }
}
