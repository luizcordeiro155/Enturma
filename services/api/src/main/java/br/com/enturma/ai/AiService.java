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
    if (!Set.of("QUESTION", "SUMMARY", "FLASHCARDS", "QUIZ", "SIMPLIFY", "STUDY_PLAN")
        .contains(mode)) throw ApiException.invalid("Modo inválido.");
    if (!provider.enabled())
      throw new ApiException(503, "AI_UNAVAILABLE", "A Enturma AI ainda não está disponível.");
    int used =
        db.jdbc.queryForObject(
            "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+interval '1 day') ON"
                + " CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limit.resets_at<now() THEN 1"
                + " ELSE rate_limit.hits+1 END,resets_at=CASE WHEN rate_limit.resets_at<now() THEN"
                + " now()+interval '1 day' ELSE rate_limit.resets_at END RETURNING hits",
            Integer.class,
            "ai:" + a.id());
    if (used > 20)
      throw new ApiException(429, "AI_LIMIT", "Você atingiu o limite diário de 20 perguntas.");
    var chunks =
        db.list(
            "SELECT c.id,c.body,c.page,m.id material_id,m.file_name FROM material_chunk c JOIN"
                + " study_material m ON m.id=c.material_id WHERE c.room_id=? AND m.status='READY'"
                + " AND (?<>'QUESTION' OR c.search @@ plainto_tsquery('portuguese',?)) ORDER BY"
                + " ts_rank(c.search,plainto_tsquery('portuguese',?)) DESC,c.ordinal,c.id LIMIT 8",
            room,
            mode,
            question,
            question);
    if (chunks.isEmpty())
      return Map.of(
          "answer",
          "Não encontrei essa informação nos materiais desta sessão.",
          "sources",
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
          .append(" (página ")
          .append(c.get("page"))
          .append(")\n")
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
    String answer = provider.answer(context.toString(), question, mode);
    study.member(a, room);
    db.jdbc.update(
        "INSERT INTO ai_message(id,room_id,user_id,question,answer) VALUES (?,?,?,?,?)",
        UUID.randomUUID(),
        room,
        a.id(),
        question,
        answer);
    return Map.of("answer", answer, "sources", sources);
  }
}
