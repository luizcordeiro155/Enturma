package br.com.enturma.chat;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {
  private final Db db;
  private final StudyService study;

  public ChatService(Db db, StudyService study) {
    this.db = db;
    this.study = study;
  }

  public Object messages(Actor a, UUID room, int page) {
    study.member(a, room);
    return db.list(
        "SELECT m.id,m.user_id,m.body,m.reply_to,m.created_at,m.edited_at,m.deleted_at,u.name FROM"
            + " chat_message m JOIN app_user u ON u.id=m.user_id WHERE room_id=? AND NOT"
            + " EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND b.blocked_id=m.user_id) OR"
            + " (b.blocked_id=? AND b.user_id=m.user_id)) ORDER BY m.created_at DESC,m.id DESC"
            + " LIMIT 30 OFFSET ?",
        room,
        a.id(),
        a.id(),
        Db.offset(page));
  }

  @Transactional
  public Object send(Actor a, UUID room, String body, UUID reply) {
    study.activeLocked(room);
    study.member(a, room);
    if (reply != null
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM chat_message WHERE id=? AND room_id=?)", reply, room))
      throw ApiException.invalid("Mensagem de referência inválida.");
    UUID id = UUID.randomUUID();
    db.jdbc.update(
        "INSERT INTO chat_message(id,room_id,user_id,body,reply_to) VALUES (?,?,?,?,?)",
        id,
        room,
        a.id(),
        body.strip(),
        reply);
    return Map.of("id", id);
  }

  @Transactional
  public void edit(Actor a, UUID room, UUID id, String body) {
    study.activeLocked(room);
    study.member(a, room);
    if (db.jdbc.update(
            "UPDATE chat_message SET body=?,edited_at=now() WHERE id=? AND room_id=? AND user_id=?"
                + " AND deleted_at IS NULL",
            body.strip(),
            id,
            room,
            a.id())
        == 0) throw ApiException.forbidden();
  }

  @Transactional
  public void delete(Actor a, UUID room, UUID id) {
    study.member(a, room);
    var m = db.one("SELECT user_id FROM chat_message WHERE id=? AND room_id=?", id, room);
    if (!m.get("userId").equals(a.id())
        && !db.exists(
            "SELECT EXISTS(SELECT 1 FROM room_participant WHERE room_id=? AND user_id=? AND role IN"
                + " ('HOST','MODERATOR') AND left_at IS NULL)",
            room,
            a.id())) throw ApiException.forbidden();
    db.jdbc.update("UPDATE chat_message SET body='',deleted_at=now() WHERE id=?", id);
    db.jdbc.update(
        "INSERT INTO audit_log(id,actor_id,action,resource_id) VALUES (?,?,'DELETE_MESSAGE',?)",
        UUID.randomUUID(),
        a.id(),
        id);
  }
}
