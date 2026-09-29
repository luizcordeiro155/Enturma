package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
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
    if (!Set.of(
            "QUESTION",
            "SUMMARY",
            "FLASHCARDS",
            "QUIZ",
            "SIMPLIFY",
            "STUDY_PLAN",
            "RESEARCH",
            "CATCH_UP",
            "SESSION_REPORT",
            "STUDY_MATERIAL")
        .contains(mode)) throw ApiException.invalid("Modo inválido.");
    if (!provider.enabled())
      throw new ApiException(503, "AI_UNAVAILABLE", "A Enturma AI ainda não está disponível.");
    boolean research = mode.equals("RESEARCH");
    if (research && !provider.webSearchEnabled())
      throw new ApiException(
          503, "AI_RESEARCH_UNAVAILABLE", "A pesquisa externa da Enturma AI não está habilitada.");

    boolean ended =
        db.exists("SELECT EXISTS(SELECT 1 FROM study_room WHERE id=? AND status='ENDED')", room);

    rateLimit(a);
    if (!ended
        && mode.equals("QUESTION")
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_message WHERE room_id=? AND deleted_at IS NULL)"
                + " OR EXISTS(SELECT 1 FROM material_chunk WHERE room_id=?)"
                + " OR EXISTS(SELECT 1 FROM room_memory_checkpoint WHERE room_id=?)",
            room,
            room,
            room)) {
      return Map.of(
          "answer",
          "Ainda não há conteúdo suficiente nesta turma para responder.",
          "sources",
          List.of(),
          "webSources",
          List.of());
    }
    String context = buildContext(room, a.id(), question, mode);
    String objective = promptFor(question, mode);
    AiProvider.Answer result = provider.answer(context, objective, mode, research);
    study.member(a, room);

    if (Set.of("SESSION_REPORT", "STUDY_MATERIAL").contains(mode))
      saveArtifact(room, a.id(), mode, titleFor(mode), result.text());

    return Map.of(
        "answer", result.text(),
        "sources", ended ? List.of() : materialSources(room, question, mode),
        "webSources", result.sources());
  }

  public Object artifacts(Actor a, UUID room) {
    study.member(a, room);
    return db.list(
        "SELECT id,kind,title,created_at FROM room_session_artifact WHERE room_id=?"
            + " ORDER BY created_at DESC LIMIT 50",
        room);
  }

  public Object artifact(Actor a, UUID room, UUID id) {
    study.member(a, room);
    return db.one(
        "SELECT id,kind,title,content,created_at FROM room_session_artifact WHERE room_id=? AND"
            + " id=?",
        room,
        id);
  }

  private void rateLimit(Actor a) {
    int used =
        db.jdbc.queryForObject(
            "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+interval '1 day') ON"
                + " CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN rate_limit.resets_at<now() THEN 1"
                + " ELSE rate_limit.hits+1 END,resets_at=CASE WHEN rate_limit.resets_at<now() THEN"
                + " now()+interval '1 day' ELSE rate_limit.resets_at END RETURNING hits",
            Integer.class,
            "ai:" + a.id());
    if (used > 40)
      throw new ApiException(429, "AI_LIMIT", "Você atingiu o limite diário da Enturma AI.");
  }

  private String promptFor(String question, String mode) {
    return switch (mode) {
      case "CATCH_UP" ->
          "Explique detalhadamente tudo o que aconteceu antes de eu entrar. Estruture em: Visão"
              + " geral, O que já foi estudado, Conceitos importantes, Decisões tomadas, Exemplos"
              + " apresentados, Exercícios, Dúvidas importantes com respostas, Materiais"
              + " compartilhados, O que está acontecendo agora e O que preciso saber para"
              + " acompanhar. Não faça um resumo curto.";
      case "SESSION_REPORT" ->
          "Gere um Relatório de estudo da sessão completo, organizado em resumo completo, assuntos"
              + " abordados, conceitos, explicações, exemplos, exercícios, perguntas e respostas,"
              + " links/materiais, decisões, observações, códigos importantes, próximos assuntos"
              + " sugeridos e pontos que precisam ser revisados.";
      case "STUDY_MATERIAL" ->
          "Transforme toda a sessão em uma apostila de estudo reutilizável. Inclua resumo, guia de"
              + " revisão, perguntas e respostas, flashcards, exercícios, tópicos importantes,"
              + " exemplos, explicações simplificadas e avançadas, glossário e checklist.";
      default -> question;
    };
  }

  private String buildContext(UUID room, UUID user, String question, String mode) {
    StringBuilder context = new StringBuilder();
    context.append("CONHECIMENTO DA SALA\n");

    var checkpoints =
        db.list(
            "SELECT summary,through_created_at FROM room_memory_checkpoint WHERE room_id=? AND"
                + " through_message_id IS NOT NULL ORDER BY through_created_at"
                + " DESC,through_message_id DESC LIMIT 1",
            room);
    for (var cp : checkpoints)
      context.append("\n[CHECKPOINT] ").append(cp.get("summary")).append("\n");

    Object joinedAt =
        db.one(
                "SELECT joined_at FROM room_participant WHERE room_id=? AND user_id=? AND NOT"
                    + " removed",
                room,
                user)
            .get("joinedAt");

    String messageSql;
    Object[] args;
    if (mode.equals("CATCH_UP")) {
      messageSql =
          "SELECT m.created_at,u.name,m.body FROM room_message m JOIN app_user u ON u.id=m.user_id"
              + " WHERE m.room_id=? AND m.created_at<?::timestamptz AND m.deleted_at IS NULL ORDER"
              + " BY m.created_at DESC LIMIT 180";
      args = new Object[] {room, joinedAt};
    } else if ((mode.equals("QUESTION") || mode.equals("RESEARCH"))
        && question != null
        && !question.isBlank()) {
      messageSql =
          "SELECT m.created_at,u.name,m.body FROM room_message m JOIN app_user u ON u.id=m.user_id"
              + " WHERE m.room_id=? AND m.deleted_at IS NULL AND m.search @@"
              + " plainto_tsquery('portuguese',?) ORDER BY"
              + " ts_rank(m.search,plainto_tsquery('portuguese',?)) DESC,m.created_at DESC LIMIT"
              + " 80";
      args = new Object[] {room, question, question};
    } else {
      messageSql =
          "SELECT m.created_at,u.name,m.body FROM room_message m JOIN app_user u ON u.id=m.user_id"
              + " WHERE m.room_id=? AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 220";
      args = new Object[] {room};
    }
    var messages = db.list(messageSql, args);
    Collections.reverse(messages);
    context.append("\nCONVERSA\n");
    for (var m : messages) {
      context
          .append(m.get("createdAt"))
          .append(" · ")
          .append(m.get("name"))
          .append(": ")
          .append(m.get("body"))
          .append("\n");
    }

    var chunks = relevantChunks(room, question, mode);
    context.append("\nMATERIAIS\n");
    for (int i = 0; i < chunks.size(); i++) {
      var c = chunks.get(i);
      context.append("[").append(i + 1).append("] ").append(c.get("fileName"));
      if (c.get("page") != null) context.append(" (p. ").append(c.get("page")).append(")");
      context.append("\n").append(c.get("body")).append("\n");
    }
    return context.substring(0, Math.min(context.length(), 60000));
  }

  private List<Map<String, Object>> relevantChunks(UUID room, String question, String mode) {
    boolean targeted =
        (mode.equals("QUESTION") || mode.equals("RESEARCH"))
            && question != null
            && !question.isBlank();
    if (targeted)
      return db.list(
          "SELECT c.id,c.body,c.page,m.id material_id,m.file_name FROM material_chunk c JOIN"
              + " study_material m ON m.id=c.material_id WHERE c.room_id=? AND m.status='READY'"
              + " AND c.search @@ plainto_tsquery('portuguese',?) ORDER BY"
              + " ts_rank(c.search,plainto_tsquery('portuguese',?)) DESC,c.ordinal LIMIT 12",
          room,
          question,
          question);
    return db.list(
        "SELECT c.id,c.body,c.page,m.id material_id,m.file_name FROM material_chunk c JOIN"
            + " study_material m ON m.id=c.material_id WHERE c.room_id=? AND m.status='READY'"
            + " ORDER BY m.created_at DESC,c.ordinal LIMIT 18",
        room);
  }

  private List<Map<String, Object>> materialSources(UUID room, String question, String mode) {
    var chunks = relevantChunks(room, question, mode);
    List<Map<String, Object>> sources = new ArrayList<>();
    for (int i = 0; i < chunks.size(); i++) {
      var c = chunks.get(i);
      var source = new LinkedHashMap<String, Object>();
      source.put("number", i + 1);
      source.put("materialId", c.get("materialId"));
      source.put("fileName", c.get("fileName"));
      source.put("page", c.get("page"));
      source.put("excerpt", c.get("body"));
      sources.add(source);
    }
    return sources;
  }

  private void saveArtifact(UUID room, UUID user, String kind, String title, String text) {
    db.jdbc.update(
        "INSERT INTO room_session_artifact(id,room_id,user_id,kind,title,content) VALUES"
            + " (?,?,?,?,?,?)",
        UUID.randomUUID(),
        room,
        user,
        kind,
        title,
        text);
  }

  private String titleFor(String mode) {
    return mode.equals("SESSION_REPORT")
        ? "Relatório de estudo da sessão"
        : "Material de estudo da sessão";
  }

  @Scheduled(fixedDelay = 60000)
  public void finalizeEndedSessions() {
    if (!provider.enabled()) return;
    var rooms =
        db.list(
            "SELECT r.id FROM study_room r WHERE r.status='ENDED' AND NOT EXISTS(SELECT 1 FROM"
                + " room_session_artifact a WHERE a.room_id=r.id AND a.kind='SESSION_REPORT') ORDER"
                + " BY r.ended_at DESC NULLS LAST LIMIT 2");
    for (var row : rooms) {
      UUID room = (UUID) row.get("id");
      try {
        if (!advanceMemory(room)) continue;
        var result =
            provider.answer(
                buildSystemContext(room), promptFor("", "SESSION_REPORT"), "SESSION_REPORT", false);
        saveArtifact(room, null, "SESSION_REPORT", "Relatório de estudo da sessão", result.text());
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(AiService.class)
            .warn("Relatório pendente para sala {}; histórico preservado", room);
      }
    }
  }

  @Scheduled(fixedDelay = 60000, initialDelay = 30000)
  public void updateActiveMemory() {
    if (!provider.enabled()) return;
    for (var row :
        db.list(
            "SELECT id FROM study_room WHERE status IN ('OPEN','ACTIVE') AND EXISTS(SELECT 1 FROM"
                + " room_message m WHERE m.room_id=study_room.id) ORDER BY created_at DESC"
                + " LIMIT 4")) {
      try {
        advanceMemory((UUID) row.get("id"));
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(AiService.class)
            .warn("Memória pendente; conversa preservada para sala {}", row.get("id"));
      }
    }
  }

  // The cursor advances only after a successful provider response. Each batch is bounded,
  // and UUID breaks timestamp ties so no message is silently skipped.
  private synchronized boolean advanceMemory(UUID room) {
    var previous =
        db.list(
            "SELECT summary,through_created_at,through_message_id FROM room_memory_checkpoint WHERE"
                + " room_id=? AND through_message_id IS NOT NULL ORDER BY through_created_at"
                + " DESC,through_message_id DESC LIMIT 1",
            room);
    Object at =
        previous.isEmpty()
            ? java.sql.Timestamp.from(java.time.Instant.EPOCH)
            : previous.getFirst().get("throughCreatedAt");
    Object id = previous.isEmpty() ? new UUID(0, 0) : previous.getFirst().get("throughMessageId");
    var batch =
        db.list(
            "SELECT m.id,m.created_at,u.name,m.body,m.attachment_id FROM room_message m JOIN"
                + " app_user u ON u.id=m.user_id WHERE m.room_id=? AND m.deleted_at IS NULL AND"
                + " (m.created_at,m.id)>(?::timestamptz,?::uuid) ORDER BY m.created_at,m.id LIMIT"
                + " 10",
            room,
            at,
            id);
    if (batch.isEmpty()) return true;
    StringBuilder context = new StringBuilder("MEMÓRIA ANTERIOR\n");
    if (!previous.isEmpty()) context.append(previous.getFirst().get("summary"));
    context.append("\nNOVAS MENSAGENS\n");
    for (var message : batch)
      context
          .append(message.get("name"))
          .append(": ")
          .append(message.get("body"))
          .append(
              message.get("attachmentId") == null
                  ? ""
                  : " [imagem anexada; conteúdo visual não analisado]")
          .append("\n");
    var answer =
        provider.answer(
            context.toString(),
            "Atualize a memória cumulativa em até 12000 caracteres. Preserve conceitos, decisões,"
                + " códigos, dúvidas e pendências. Distinga fatos de hipóteses e não invente"
                + " conteúdo de anexos.",
            "SUMMARY",
            false);
    if (answer.text() == null || answer.text().isBlank() || answer.text().length() > 16000)
      throw new IllegalStateException("Memória fora do limite");
    var last = batch.getLast();
    db.jdbc.update(
        "INSERT INTO"
            + " room_memory_checkpoint(id,room_id,summary,through_created_at,through_message_id)"
            + " VALUES (?,?,?,?::timestamptz,?)",
        UUID.randomUUID(),
        room,
        answer.text(),
        last.get("createdAt"),
        last.get("id"));
    return batch.size() < 10;
  }

  private String buildSystemContext(UUID room) {
    StringBuilder out = new StringBuilder("SESSÃO ENCERRADA\nMEMÓRIA CONSOLIDADA\n");
    for (var cp :
        db.list(
            "SELECT summary FROM room_memory_checkpoint WHERE room_id=? AND through_message_id IS"
                + " NOT NULL ORDER BY through_created_at DESC,through_message_id DESC LIMIT 1",
            room)) out.append(cp.get("summary"));
    for (var c : relevantChunks(room, "", "SUMMARY"))
      out.append("\n[MATERIAL ").append(c.get("fileName")).append("]\n").append(c.get("body"));
    return out.substring(0, Math.min(out.length(), 60000));
  }
}
