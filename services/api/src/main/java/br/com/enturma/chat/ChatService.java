package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.materials.ObjectStorageService;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {
  private final Db db;
  private final StudyService study;
  private final ObjectStorageService storage;

  public ChatService(Db db, StudyService study, ObjectStorageService storage) {
    this.db = db;
    this.study = study;
    this.storage = storage;
  }

  private boolean open(UUID room) {
    return db.exists(
        "SELECT EXISTS(SELECT 1 FROM study_room WHERE id=? AND status IN ('OPEN','ACTIVE') AND ends_at>now())",
        room);
  }

  public Object messages(Actor a, UUID room, int page) {
    study.member(a, room);
    if (!open(room)) return List.of();
    return db.list(
        "SELECT m.id,m.user_id,m.body,m.reply_to,m.created_at,m.edited_at,m.deleted_at,u.name,"
            + " a.id attachment_id,a.file_name attachment_name,a.mime_type attachment_mime,"
            + " a.file_size attachment_size FROM room_message m JOIN app_user u ON u.id=m.user_id"
            + " LEFT JOIN room_attachment a ON a.id=m.attachment_id WHERE m.room_id=? AND NOT"
            + " EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND b.blocked_id=m.user_id) OR"
            + " (b.blocked_id=? AND b.user_id=m.user_id)) ORDER BY m.created_at DESC,m.id DESC"
            + " LIMIT 50 OFFSET ?",
        room, a.id(), a.id(), Math.clamp(page, 0, 10000) * 50);
  }

  public Object reactions(Actor a, UUID room, UUID message) {
    study.member(a, room);
    if (!open(room)) return List.of();
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=?)", message, room))
      throw ApiException.missing();
    return db.list(
        "SELECT emoji,count(*) count,bool_or(user_id=?) mine FROM room_reaction WHERE message_id=?"
            + " GROUP BY emoji ORDER BY min(created_at)",
        a.id(), message);
  }

  @Transactional
  public Object send(Actor a, UUID room, String body, UUID reply, UUID attachment) {
    study.activeLocked(room);
    study.member(a, room);
    String text = body == null ? "" : body.strip();
    if (text.isBlank() && attachment == null)
      throw ApiException.invalid("Escreva uma mensagem ou anexe uma imagem.");
    if (text.length() > 4000) throw ApiException.invalid("A mensagem pode ter no máximo 4000 caracteres.");
    if (reply != null && !db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=?)", reply, room))
      throw ApiException.invalid("Mensagem de referência inválida.");
    if (attachment != null && !db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_attachment WHERE id=? AND room_id=? AND uploaded_by=?)",
        attachment, room, a.id()))
      throw ApiException.invalid("Anexo inválido.");
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO room_message(id,room_id,user_id,body,reply_to,attachment_id) VALUES (?,?,?,?,?,?)",
        id, room, a.id(), text.isBlank() ? null : text, reply, attachment);
    return Map.of("id", id);
  }

  @Transactional
  public void edit(Actor a, UUID room, UUID id, String body) {
    study.activeLocked(room);
    study.member(a, room);
    String text = body == null ? "" : body.strip();
    if (text.isBlank() || text.length() > 4000) throw ApiException.invalid("Mensagem inválida.");
    if (db.jdbc.update(
            "UPDATE room_message SET body=?,edited_at=now() WHERE id=? AND room_id=? AND user_id=?"
                + " AND deleted_at IS NULL",
            text, id, room, a.id()) == 0) throw ApiException.forbidden();
  }

  @Transactional
  public void delete(Actor a, UUID room, UUID id) {
    study.activeLocked(room);
    study.member(a, room);
    var m = db.one("SELECT user_id FROM room_message WHERE id=? AND room_id=?", id, room);
    if (!m.get("userId").equals(a.id())
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_participant WHERE room_id=? AND user_id=? AND role IN"
                + " ('HOST','MODERATOR') AND NOT removed)",
            room, a.id())) throw ApiException.forbidden();
    db.jdbc.update("UPDATE room_message SET body=NULL,deleted_at=now() WHERE id=?", id);
  }

  @Transactional
  public Object upload(Actor a, UUID room, String fileName, String mime, byte[] bytes) {
    study.activeLocked(room);
    study.member(a, room);
    if (!storage.enabled())
      throw new ApiException(503, "STORAGE_UNAVAILABLE", "O envio de imagens ainda não está disponível.");
    if (bytes.length == 0 || bytes.length > 8 * 1024 * 1024)
      throw ApiException.invalid("A imagem deve ter no máximo 8 MB.");
    if (!Set.of("image/jpeg", "image/png", "image/webp", "image/gif").contains(mime))
      throw ApiException.invalid("Use JPG, PNG, WEBP ou GIF.");
    String name = fileName == null ? "imagem" : fileName.replaceAll("[\\\\/\\r\\n]", "_");
    if (name.length() > 200) name = name.substring(name.length() - 200);
    UUID id = UUID.randomUUID();
    String key = "room-chat/" + room + "/" + id;
    storage.put(key, bytes, mime);
    db.jdbc.update(
        "INSERT INTO room_attachment(id,room_id,uploaded_by,file_name,storage_key,mime_type,file_size)"
            + " VALUES (?,?,?,?,?,?,?)",
        id, room, a.id(), name, key, mime, bytes.length);
    return Map.of("id", id, "fileName", name, "mimeType", mime, "fileSize", bytes.length);
  }

  public record Download(byte[] body, String name, String mime) {}

  public Download download(Actor a, UUID room, UUID id) {
    study.member(a, room);
    if (!open(room))
      throw new ApiException(410, "CHAT_PURGED", "O conteúdo bruto do chat foi encerrado com a sala.");
    var attachment = db.one("SELECT * FROM room_attachment WHERE id=? AND room_id=?", id, room);
    return new Download(
        storage.get((String) attachment.get("storageKey")),
        (String) attachment.get("fileName"),
        (String) attachment.get("mimeType"));
  }

  @Transactional
  public void react(Actor a, UUID room, UUID message, String emoji) {
    study.activeLocked(room);
    study.member(a, room);
    if (emoji == null || emoji.isBlank() || emoji.length() > 16)
      throw ApiException.invalid("Reação inválida.");
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=? AND deleted_at IS NULL)",
        message, room)) throw ApiException.missing();
    db.jdbc.update(
        "INSERT INTO room_reaction(message_id,user_id,emoji) VALUES (?,?,?) ON CONFLICT DO NOTHING",
        message, a.id(), emoji);
  }

  @Transactional
  public void unreact(Actor a, UUID room, UUID message, String emoji) {
    study.activeLocked(room);
    study.member(a, room);
    db.jdbc.update(
        "DELETE FROM room_reaction WHERE message_id=? AND user_id=? AND emoji=?",
        message, a.id(), emoji);
  }

  public void purgeRawRoom(UUID room) {
    var attachments = db.list("SELECT storage_key FROM room_attachment WHERE room_id=?", room);
    for (var item : attachments) {
      try {
        if (storage.enabled()) storage.delete((String) item.get("storageKey"));
      } catch (Exception ignored) {
      }
    }
    db.jdbc.update("DELETE FROM room_reaction WHERE message_id IN (SELECT id FROM room_message WHERE room_id=?)", room);
    db.jdbc.update("UPDATE room_message SET reply_to=NULL WHERE room_id=?", room);
    db.jdbc.update("DELETE FROM room_message WHERE room_id=?", room);
    db.jdbc.update("DELETE FROM room_attachment WHERE room_id=?", room);
  }
}
