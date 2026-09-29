package br.com.enturma.materials;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.study.StudyService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MaterialService {
  private final Db db;
  private final StudyService study;
  private final ObjectStorageService storage;
  private final DocumentParser parser;

  public MaterialService(
      Db db, StudyService study, ObjectStorageService storage, DocumentParser parser) {
    this.db = db;
    this.study = study;
    this.storage = storage;
    this.parser = parser;
  }

  public Object list(Actor a, UUID room) {
    study.member(a, room);
    return db.list(
        "SELECT id,file_name,mime_type,file_size,status,created_at FROM study_material WHERE"
            + " room_id=? AND status='READY' ORDER BY created_at DESC LIMIT 30",
        room);
  }

  @Transactional
  public Object upload(Actor a, UUID room, String fileName, byte[] bytes) {
    study.activeLocked(room);
    study.member(a, room);
    if (db.jdbc.queryForObject(
            "SELECT count(*) FROM study_material WHERE room_id=? AND status='READY'",
            Long.class,
            room)
        >= 10) throw ApiException.invalid("Esta sala já possui 10 materiais.");
    String name = fileName == null ? "documento" : fileName.replaceAll("[\\\\/\\r\\n]", "_");
    if (name.length() > 200) name = name.substring(name.length() - 200);
    var parsed = parser.parse(bytes, name);
    UUID id = UUID.randomUUID();
    String key = storage.enabled() ? "rooms/" + room + "/" + id : "db:" + id;
    byte[] inline = null;
    if (storage.enabled()) {
      storage.put(key, bytes, parsed.mime());
      org.springframework.transaction.support.TransactionSynchronizationManager
          .registerSynchronization(
              new org.springframework.transaction.support.TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                  if (status != STATUS_COMMITTED)
                    try {
                      storage.delete(key);
                    } catch (Exception ignored) {
                    }
                }
              });
    } else {
      inline = bytes;
    }
    db.jdbc.update(
        "INSERT INTO"
            + " study_material(id,room_id,uploaded_by,file_name,storage_key,mime_type,file_size,inline_bytes)"
            + " VALUES (?,?,?,?,?,?,?,?)",
        id,
        room,
        a.id(),
        name,
        key,
        parsed.mime(),
        bytes.length,
        inline);
    for (var c : parsed.chunks())
      db.jdbc.update(
          "INSERT INTO material_chunk(id,material_id,room_id,ordinal,page,body) VALUES"
              + " (?,?,?,?,?,?)",
          UUID.randomUUID(),
          id,
          room,
          c.ordinal(),
          c.page(),
          c.body());
    return Map.of("id", id, "chunks", parsed.chunks().size());
  }

  public record Download(byte[] body, String name, String mime) {}

  public Download download(Actor a, UUID room, UUID id) {
    study.member(a, room);
    var m =
        db.one(
            "SELECT * FROM study_material WHERE id=? AND room_id=? AND status='READY'", id, room);
    byte[] inline = (byte[]) m.get("inlineBytes");
    byte[] body =
        inline != null ? inline : storage.get((String) m.get("storageKey"));
    return new Download(
        body,
        (String) m.get("fileName"),
        (String) m.get("mimeType"));
  }
}
