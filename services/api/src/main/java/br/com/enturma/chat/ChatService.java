package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {
  private static final int PAGE_SIZE = 200;
  private static final int MAX_IMAGE_BYTES = 8 * 1024 * 1024;
  private static final int MAX_IMAGE_DATA_CHARS = 11_500_000;
  private static final Set<String> IMAGE_TYPES =
      Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

  private final Db db;
  private final StudyService study;

  public ChatService(Db db, StudyService study) {
    this.db = db;
    this.study = study;
  }

  public record ImagePayload(String name, String mime, Integer size, String dataUrl) {}

  public List<Map<String, Object>> messages(Actor actor, UUID room, int page) {
    study.participant(actor, room);
    int safePage = Math.clamp(page, 0, 10000);
    var rows =
        db.list(
            "SELECT m.id,m.room_id,m.user_id,u.name sender_name,m.body,m.image_name,"
                + " m.image_mime,m.image_size,m.image_data,m.reply_to,m.created_at,m.deleted_at"
                + " FROM room_message m JOIN app_user u ON u.id=m.user_id WHERE m.room_id=?"
                + " ORDER BY m.created_at,m.id LIMIT ? OFFSET ?",
            room,
            PAGE_SIZE,
            safePage * PAGE_SIZE);
    attachReactions(room, rows);
    rows.forEach(this::hideDeletedContent);
    return rows;
  }

  public long count(UUID room) {
    return Optional.ofNullable(
            db.jdbc.queryForObject("SELECT count(*) FROM room_message WHERE room_id=?", Long.class, room))
        .orElse(0L);
  }

  public long countBefore(UUID room, String joinedAt) {
    if (joinedAt == null || joinedAt.isBlank()) return 0;
    return Optional.ofNullable(
            db.jdbc.queryForObject(
                "SELECT count(*) FROM room_message WHERE room_id=? AND created_at<?::timestamptz",
                Long.class,
                room,
                joinedAt))
        .orElse(0L);
  }

  @Transactional
  public Map<String, Object> send(
      Actor actor, UUID room, UUID requestedId, String rawBody, UUID replyTo, ImagePayload image) {
    study.activeLocked(room);
    study.member(actor, room);

    String body = rawBody == null ? null : rawBody.strip();
    if (body != null && body.isBlank()) body = null;
    if (body != null && body.length() > 4000)
      throw ApiException.invalid("A mensagem pode ter no máximo 4000 caracteres.");

    ImagePayload safeImage = validateImage(image);
    if (body == null && safeImage == null)
      throw ApiException.invalid("Escreva uma mensagem ou selecione uma imagem.");

    if (replyTo != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=?)",
            replyTo,
            room))
      throw ApiException.invalid("A mensagem respondida não pertence a esta sala.");

    UUID id = requestedId == null ? UUID.randomUUID() : requestedId;
    int inserted =
        db.jdbc.update(
            "INSERT INTO room_message(id,room_id,user_id,body,image_name,image_mime,image_size,"
                + " image_data,reply_to) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
            id,
            room,
            actor.id(),
            body,
            safeImage == null ? null : safeImage.name(),
            safeImage == null ? null : safeImage.mime(),
            safeImage == null ? null : safeImage.size(),
            safeImage == null ? null : safeImage.dataUrl(),
            replyTo);

    if (inserted == 0) {
      var existing = db.one("SELECT room_id,user_id FROM room_message WHERE id=?", id);
      if (!room.equals(existing.get("roomId")) || !actor.id().equals(existing.get("userId")))
        throw new ApiException(409, "MESSAGE_ID_CONFLICT", "Identificador de mensagem em uso.");
    }
    return message(actor, room, id);
  }

  public Map<String, Object> message(Actor actor, UUID room, UUID id) {
    study.participant(actor, room);
    var row =
        db.one(
            "SELECT m.id,m.room_id,m.user_id,u.name sender_name,m.body,m.image_name,"
                + " m.image_mime,m.image_size,m.image_data,m.reply_to,m.created_at,m.deleted_at"
                + " FROM room_message m JOIN app_user u ON u.id=m.user_id"
                + " WHERE m.room_id=? AND m.id=?",
            room,
            id);
    attachReactions(room, List.of(row));
    hideDeletedContent(row);
    return row;
  }

  @Transactional
  public void delete(Actor actor, UUID room, UUID id) {
    study.activeLocked(room);
    study.member(actor, room);
    var row =
        db.one("SELECT user_id FROM room_message WHERE id=? AND room_id=? FOR UPDATE", id, room);
    if (!actor.id().equals(row.get("userId")) && !actor.admin()) throw ApiException.forbidden();
    db.jdbc.update(
        "UPDATE room_message SET deleted_at=coalesce(deleted_at,now()),body=NULL,image_name=NULL,"
            + " image_mime=NULL,image_size=NULL,image_data=NULL WHERE id=?",
        id);
    db.jdbc.update("DELETE FROM room_message_reaction WHERE message_id=?", id);
  }

  @Transactional
  public void setReaction(Actor actor, UUID room, UUID id, String rawEmoji, boolean active) {
    study.activeLocked(room);
    study.member(actor, room);
    String emoji = rawEmoji == null ? "" : rawEmoji.strip();
    if (emoji.isBlank() || emoji.length() > 16) throw ApiException.invalid("Reação inválida.");
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=? AND deleted_at IS NULL)",
        id,
        room)) throw ApiException.missing();
    if (active)
      db.jdbc.update(
          "INSERT INTO room_message_reaction(message_id,user_id,emoji) VALUES (?,?,?) ON CONFLICT DO NOTHING",
          id,
          actor.id(),
          emoji);
    else
      db.jdbc.update(
          "DELETE FROM room_message_reaction WHERE message_id=? AND user_id=? AND emoji=?",
          id,
          actor.id(),
          emoji);
  }

  public String transcript(UUID room, int maxChars) {
    int limit = Math.clamp(maxChars, 1000, 120000);
    var rows =
        db.list(
            "SELECT u.name,m.body,m.image_name,m.created_at,m.deleted_at FROM room_message m"
                + " JOIN app_user u ON u.id=m.user_id WHERE m.room_id=? ORDER BY m.created_at,m.id LIMIT 1000",
            room);
    StringBuilder out = new StringBuilder();
    for (var row : rows) {
      if (row.get("deletedAt") != null) continue;
      String body = Objects.toString(row.get("body"), "").strip();
      String image = Objects.toString(row.get("imageName"), "").strip();
      if (body.isBlank() && image.isBlank()) continue;
      String line =
          "[" + Objects.toString(row.get("createdAt"), "") + "] "
              + Objects.toString(row.get("name"), "Estudante") + ": "
              + body
              + (image.isBlank() ? "" : (body.isBlank() ? "" : " ") + "[imagem: " + image + "]")
              + "\n";
      if (out.length() + line.length() > limit) break;
      out.append(line);
    }
    return out.toString();
  }

  private ImagePayload validateImage(ImagePayload image) {
    if (image == null || image.dataUrl() == null || image.dataUrl().isBlank()) return null;
    String name = Objects.toString(image.name(), "imagem");
    String mime = Objects.toString(image.mime(), "");
    int size = image.size() == null ? -1 : image.size();
    String data = image.dataUrl();
    if (name.length() > 255) throw ApiException.invalid("Nome de imagem muito longo.");
    if (!IMAGE_TYPES.contains(mime)) throw ApiException.invalid("Formato de imagem não permitido.");
    if (size < 0 || size > MAX_IMAGE_BYTES) throw ApiException.invalid("A imagem pode ter no máximo 8 MB.");
    String prefix = "data:" + mime + ";base64,";
    if (!data.startsWith(prefix) || data.length() > MAX_IMAGE_DATA_CHARS)
      throw ApiException.invalid("Conteúdo de imagem inválido.");
    return new ImagePayload(name, mime, size, data);
  }

  private void attachReactions(UUID room, List<Map<String, Object>> rows) {
    if (rows.isEmpty()) return;
    Map<UUID, Map<String, List<String>>> grouped = new HashMap<>();
    for (var reaction :
        db.list(
            "SELECT r.message_id,r.user_id,r.emoji FROM room_message_reaction r"
                + " JOIN room_message m ON m.id=r.message_id WHERE m.room_id=? ORDER BY r.created_at",
            room)) {
      UUID messageId = (UUID) reaction.get("messageId");
      grouped
          .computeIfAbsent(messageId, ignored -> new LinkedHashMap<>())
          .computeIfAbsent(Objects.toString(reaction.get("emoji"), ""), ignored -> new ArrayList<>())
          .add(Objects.toString(reaction.get("userId"), ""));
    }
    for (var row : rows) {
      UUID id = (UUID) row.get("id");
      row.put("reactions", grouped.getOrDefault(id, Map.of()));
    }
  }

  private void hideDeletedContent(Map<String, Object> row) {
    if (row.get("deletedAt") == null) return;
    row.put("body", null);
    row.put("imageName", null);
    row.put("imageMime", null);
    row.put("imageSize", null);
    row.put("imageData", null);
    row.put("reactions", Map.of());
  }
}
