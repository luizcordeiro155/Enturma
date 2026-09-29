package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import br.com.enturma.chat.ChatService;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionStudyService {
  private final Db db;
  private final StudyService study;
  private final ChatService chat;
  private final AiProvider provider;

  public SessionStudyService(Db db, StudyService study, ChatService chat, AiProvider provider) {
    this.db = db;
    this.study = study;
    this.chat = chat;
    this.provider = provider;
  }

  public Map<String, Object> get(Actor actor, UUID room) {
    study.participant(actor, room);
    var rows =
        db.list(
            "SELECT status,content,message_count,generated_at,updated_at FROM room_study_summary WHERE room_id=?",
            room);
    if (rows.isEmpty())
      return new LinkedHashMap<>(
          Map.of("status", "MISSING", "content", "", "messageCount", 0, "generatedAt", ""));
    return rows.getFirst();
  }

  public Map<String, Object> recap(Actor actor, UUID room) {
    study.member(actor, room);
    if (!provider.enabled())
      throw new ApiException(503, "AI_UNAVAILABLE", "A Enturma AI ainda não está disponível.");
    var membership =
        db.one("SELECT joined_at FROM room_participant WHERE room_id=? AND user_id=?", room, actor.id());
    String joinedAt = Objects.toString(membership.get("joinedAt"), "");
    long previousMessages = chat.countBefore(room, joinedAt);
    if (previousMessages == 0)
      return Map.of(
          "answer",
          "Você entrou no início desta sessão; ainda não há contexto anterior para recuperar.",
          "messagesBeforeJoin",
          0);

    String context =
        "CONVERSA ANTERIOR À ENTRADA DO ESTUDANTE:\n"
            + transcriptBefore(room, joinedAt, 60000)
            + "\nMATERIAIS DISPONÍVEIS:\n"
            + materialContext(room);
    String objective =
        "Explique para um estudante que acabou de entrar tudo que ele precisa saber para acompanhar"
            + " a turma agora. Organize em resumo geral, conceitos, exemplos, dúvidas resolvidas,"
            + " decisões, pontos em aberto e próximos passos. Não invente conteúdo.";
    String answer = provider.answer(context, objective, "CONTEXT_RECAP", false).text();
    return Map.of("answer", answer, "messagesBeforeJoin", previousMessages);
  }

  @Transactional
  public Map<String, Object> request(Actor actor, UUID room) {
    study.participant(actor, room);
    var state = db.one("SELECT status FROM study_room WHERE id=? FOR UPDATE", room);
    if (!"ENDED".equals(state.get("status")))
      throw ApiException.invalid("O estudo final é gerado depois que a sessão termina.");
    db.jdbc.update(
        "INSERT INTO room_study_summary(room_id,status,updated_at) VALUES (?,'PENDING',now())"
            + " ON CONFLICT(room_id) DO UPDATE SET status='PENDING',last_error=NULL,updated_at=now()",
        room);
    return get(actor, room);
  }

  @Scheduled(fixedDelay = 15000)
  public void generatePending() {
    if (!provider.enabled()) return;
    db.jdbc.update(
        "UPDATE room_study_summary SET status='PENDING',updated_at=now()"
            + " WHERE status='PROCESSING' AND updated_at<now()-interval '5 minutes'");
    var pending =
        db.list(
            "SELECT room_id FROM room_study_summary WHERE status='PENDING' ORDER BY updated_at,room_id LIMIT 1");
    if (pending.isEmpty()) return;
    UUID room = (UUID) pending.getFirst().get("roomId");
    if (db.jdbc.update(
            "UPDATE room_study_summary SET status='PROCESSING',updated_at=now() WHERE room_id=? AND status='PENDING'",
            room)
        != 1) return;

    try {
      String context =
          "CONVERSA DA SESSÃO:\n"
              + chat.transcript(room, 70000)
              + "\nMATERIAIS DA SESSÃO:\n"
              + materialContext(room);
      String objective =
          "Crie um material de estudo completo e reutilizável desta sessão. Organize em visão geral,"
              + " conceitos estudados, explicações passo a passo, exemplos, dúvidas e respostas,"
              + " pontos de atenção, checklist de revisão, exercícios práticos, autoavaliação e"
              + " plano de revisão. Não invente assuntos ausentes do contexto.";
      String generated = provider.answer(context, objective, "SESSION_STUDY", false).text();
      int count = (int) Math.min(Integer.MAX_VALUE, chat.count(room));
      db.jdbc.update(
          "UPDATE room_study_summary SET status='READY',content=?,message_count=?,last_error=NULL,"
              + " generated_at=now(),updated_at=now() WHERE room_id=?",
          generated,
          count,
          room);
    } catch (Exception e) {
      String raw = e.getMessage() == null ? "Falha ao gerar o estudo da sessão." : e.getMessage();
      db.jdbc.update(
          "UPDATE room_study_summary SET status='FAILED',last_error=?,updated_at=now() WHERE room_id=?",
          raw.substring(0, Math.min(500, raw.length())),
          room);
    }
  }

  private String transcriptBefore(UUID room, String joinedAt, int maxChars) {
    var rows =
        db.list(
            "SELECT u.name,m.body,m.image_name,m.created_at,m.deleted_at FROM room_message m"
                + " JOIN app_user u ON u.id=m.user_id WHERE m.room_id=?"
                + " AND m.created_at<?::timestamptz ORDER BY m.created_at,m.id LIMIT 1000",
            room,
            joinedAt);
    StringBuilder out = new StringBuilder();
    for (var row : rows) {
      if (row.get("deletedAt") != null) continue;
      String body = Objects.toString(row.get("body"), "").strip();
      String image = Objects.toString(row.get("imageName"), "").strip();
      if (body.isBlank() && image.isBlank()) continue;
      String line =
          Objects.toString(row.get("name"), "Estudante")
              + ": "
              + body
              + (image.isBlank() ? "" : " [imagem: " + image + "]")
              + "\n";
      if (out.length() + line.length() > maxChars) break;
      out.append(line);
    }
    return out.toString();
  }

  private String materialContext(UUID room) {
    var chunks =
        db.list(
            "SELECT c.body,c.page,m.file_name FROM material_chunk c JOIN study_material m"
                + " ON m.id=c.material_id WHERE c.room_id=? AND m.status='READY'"
                + " ORDER BY m.created_at,c.ordinal LIMIT 16",
            room);
    StringBuilder out = new StringBuilder();
    for (var chunk : chunks) {
      out.append("[")
          .append(Objects.toString(chunk.get("fileName"), "material"))
          .append(chunk.get("page") == null ? "" : " · página " + chunk.get("page"))
          .append("]\n")
          .append(Objects.toString(chunk.get("body"), ""))
          .append("\n");
      if (out.length() > 45000) break;
    }
    return out.toString();
  }
}
