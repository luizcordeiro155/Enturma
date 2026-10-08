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
  private final br.com.enturma.moderation.AutoModService automod;
  private final br.com.enturma.notifications.NotificationService notices;
  private final StudyService study;
  private final ObjectStorageService storage;

  public ChatService(
      Db db,
      StudyService study,
      ObjectStorageService storage,
      br.com.enturma.notifications.NotificationService notices,
      br.com.enturma.moderation.AutoModService automod) {
    this.automod = automod;
    this.notices = notices;
    this.db = db;
    this.study = study;
    this.storage = storage;
  }

  private boolean open(UUID room) {
    return db.exists(
        "SELECT EXISTS(SELECT 1 FROM study_room WHERE id=? AND status IN ('OPEN','ACTIVE') AND"
            + " ends_at>now())",
        room);
  }

  public Object messages(Actor a, UUID room, int page) {
    return messageRows(a, room, page, null);
  }

  public Object target(Actor a, UUID room, UUID target) {
    return messageRows(a, room, 0, target);
  }

  private Object messageRows(Actor a, UUID room, int page, UUID target) {
    study.member(a, room);
    return db.list(
        "SELECT m.id,m.user_id,m.body,m.reply_to,m.created_at,m.edited_at,m.deleted_at,(SELECT"
            + " created_at FROM room_message_hidden h WHERE h.message_id=m.id AND"
            + " h.user_id=?::uuid)"
            + " hidden_at,u.name,u.username,u.accent_color,u.profile_details,u.avatar_bytes IS NOT"
            + " NULL has_avatar, a.id attachment_id,a.file_name attachment_name,a.mime_type"
            + " attachment_mime, a.file_size attachment_size, COALESCE((SELECT jsonb_agg(r) FROM"
            + " (SELECT emoji,count(*) count,bool_or(user_id=?::uuid) mine FROM room_reaction WHERE"
            + " message_id=m.id GROUP BY emoji ORDER BY min(created_at)) r),'[]'::jsonb) reactions"
            + " FROM room_message m JOIN app_user u ON u.id=m.user_id LEFT JOIN room_attachment a"
            + " ON a.id=m.attachment_id WHERE m.room_id=? AND (?::uuid IS NULL OR m.id=?) AND NOT"
            + " EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND b.blocked_id=m.user_id) OR"
            + " (b.blocked_id=? AND b.user_id=m.user_id)) ORDER BY m.created_at DESC,m.id DESC"
            + " LIMIT 50 OFFSET ?",
        a.id(),
        a.id(),
        room,
        target,
        target,
        a.id(),
        a.id(),
        Math.clamp(page, 0, 10000) * 50);
  }

  public Object reactions(Actor a, UUID room, UUID message) {
    study.member(a, room);
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=?)", message, room))
      throw ApiException.missing();
    return db.list(
        "SELECT emoji,count(*) count,bool_or(user_id=?) mine FROM room_reaction WHERE message_id=?"
            + " GROUP BY emoji ORDER BY min(created_at)",
        a.id(),
        message);
  }

  @Transactional(noRollbackFor = br.com.enturma.moderation.PenaltyException.class)
  public Object send(Actor a, UUID room, String body, UUID reply) {
    return send(a, room, body, reply, null);
  }

  @Transactional(noRollbackFor = br.com.enturma.moderation.PenaltyException.class)
  public Object send(Actor a, UUID room, String body, UUID reply, UUID attachment) {
    study.activeLocked(room);
    study.member(a, room);
    String text = body == null ? "" : body.strip();
    if (text.isBlank() && attachment == null)
      throw ApiException.invalid("Escreva uma mensagem ou anexe uma imagem.");
    if (text.length() > 4000)
      throw ApiException.invalid("A mensagem pode ter no máximo 4000 caracteres.");
    if (reply != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=?)", reply, room))
      throw ApiException.invalid("Mensagem de referência inválida.");
    if (attachment != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_attachment WHERE id=? AND room_id=? AND"
                + " uploaded_by=?)",
            attachment,
            room,
            a.id())) throw ApiException.invalid("Anexo inválido.");
    automod.inspect(a, room, text);
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO room_message(id,room_id,user_id,body,reply_to,attachment_id) VALUES"
            + " (?,?,?,?,?,?)",
        id,
        room,
        a.id(),
        text.isBlank() ? null : text,
        reply,
        attachment);
    var mentions = notices.mentions(text);
    for (var member :
        db.list(
            "SELECT user_id FROM room_participant WHERE room_id=? AND NOT removed AND left_at IS"
                + " NULL",
            room)) {
      UUID user = (UUID) member.get("userId");
      notices.send(
          a.id(),
          user,
          mentions.contains(user) ? "MENTION" : "ROOM_MESSAGE",
          "room:" + room,
          id,
          "/rooms/" + room + "#message-" + id,
          mentions.contains(user)
              ? "Você foi mencionado na sala de estudo."
              : "Nova mensagem na sua sala de estudo.");
    }
    return Map.of("id", id);
  }

  @Transactional(noRollbackFor = br.com.enturma.moderation.PenaltyException.class)
  public void edit(Actor a, UUID room, UUID id, String body) {
    study.activeLocked(room);
    study.member(a, room);
    String text = body == null ? "" : body.strip();
    if (text.isBlank() || text.length() > 4000) throw ApiException.invalid("Mensagem inválida.");
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=? AND user_id=? AND"
            + " deleted_at IS NULL)",
        id,
        room,
        a.id())) throw ApiException.forbidden();
    automod.inspect(a, room, text);
    if (db.jdbc.update(
            "UPDATE room_message SET body=?,edited_at=now() WHERE id=? AND room_id=? AND user_id=?"
                + " AND deleted_at IS NULL",
            text,
            id,
            room,
            a.id())
        == 0) throw ApiException.forbidden();
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
            room,
            a.id())) throw ApiException.forbidden();
    db.jdbc.update("UPDATE room_message SET body=NULL,deleted_at=now() WHERE id=?", id);
    db.jdbc.update("DELETE FROM room_reaction WHERE message_id=?", id);
    db.jdbc.update("DELETE FROM notification WHERE target_id=?", id);
  }

  @Transactional
  public void hide(Actor a, UUID room, UUID id) {
    study.member(a, room);
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=?)", id, room))
      throw ApiException.missing();
    db.jdbc.update(
        "INSERT INTO room_message_hidden(message_id,user_id) VALUES (?,?) ON CONFLICT DO NOTHING",
        id,
        a.id());
    db.jdbc.update("DELETE FROM notification WHERE target_id=? AND user_id=?", id, a.id());
  }

  @Transactional
  public Object upload(Actor a, UUID room, String fileName, String mime, byte[] bytes) {
    study.activeLocked(room);
    study.member(a, room);
    automod.allowed(a.id(), room);
    if (bytes.length == 0 || bytes.length > 8 * 1024 * 1024)
      throw ApiException.invalid("A imagem deve ter no máximo 8 MB.");
    if (!Set.of("image/jpeg", "image/png", "image/webp", "image/gif").contains(mime))
      throw ApiException.invalid("Use JPG, PNG, WEBP ou GIF.");
    String name = fileName == null ? "imagem" : fileName.replaceAll("[\\\\/\\r\\n]", "_");
    if (name.length() > 200) name = name.substring(name.length() - 200);
    UUID id = UUID.randomUUID();
    String key = "room-chat/" + room + "/" + id;
    if (storage.enabled()) storage.put(key, bytes, mime);
    db.jdbc.update(
        "INSERT INTO"
            + " room_attachment(id,room_id,uploaded_by,file_name,storage_key,mime_type,file_size,inline_bytes)"
            + " VALUES (?,?,?,?,?,?,?,?)",
        id,
        room,
        a.id(),
        name,
        key,
        mime,
        bytes.length,
        storage.enabled() ? null : bytes);
    return Map.of("id", id, "fileName", name, "mimeType", mime, "fileSize", bytes.length);
  }

  public record Download(byte[] body, String name, String mime) {}

  public Download download(Actor a, UUID room, UUID id) {
    study.member(a, room);
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE attachment_id=? AND room_id=? AND"
            + " deleted_at IS NOT NULL)",
        id,
        room)) throw ApiException.missing();
    var attachment = db.one("SELECT * FROM room_attachment WHERE id=? AND room_id=?", id, room);
    return new Download(
        attachment.get("inlineBytes") instanceof byte[] content
            ? content
            : storage.get((String) attachment.get("storageKey")),
        (String) attachment.get("fileName"),
        (String) attachment.get("mimeType"));
  }

  @Transactional
  public void react(Actor a, UUID room, UUID message, String emoji) {
    study.activeLocked(room);
    study.member(a, room);
    automod.allowed(a.id(), room);
    EmojiReaction.validate(emoji);
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM room_message WHERE id=? AND room_id=? AND deleted_at IS NULL)",
        message,
        room)) throw ApiException.missing();
    db.jdbc.update(
        "INSERT INTO room_reaction(message_id,user_id,emoji) VALUES (?,?,?) ON CONFLICT DO NOTHING",
        message,
        a.id(),
        emoji);
  }

  @Transactional
  public void unreact(Actor a, UUID room, UUID message, String emoji) {
    study.activeLocked(room);
    study.member(a, room);
    db.jdbc.update(
        "DELETE FROM room_reaction WHERE message_id=? AND user_id=? AND emoji=?",
        message,
        a.id(),
        emoji);
  }
}
