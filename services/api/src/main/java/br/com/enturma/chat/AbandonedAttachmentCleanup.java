package br.com.enturma.chat;

import br.com.enturma.common.Db;
import br.com.enturma.materials.ObjectStorageService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Only uploads never used in a message expire. Published room history is retained. */
@Service
public class AbandonedAttachmentCleanup {
  private final Db db;
  private final ObjectStorageService storage;

  public AbandonedAttachmentCleanup(Db db, ObjectStorageService storage) {
    this.db = db;
    this.storage = storage;
  }

  @Scheduled(fixedDelay = 3600000, initialDelay = 60000)
  @Transactional
  public void clean() {
    var rows =
        db.list(
            "SELECT a.id,a.storage_key,a.inline_bytes IS NOT NULL stored_inline FROM"
                + " room_attachment a WHERE created_at<now()-interval '24 hours' AND NOT"
                + " EXISTS(SELECT 1 FROM room_message m WHERE m.attachment_id=a.id) ORDER BY"
                + " created_at LIMIT 20 FOR UPDATE OF a SKIP LOCKED");
    for (var row : rows) {
      // The lock also serializes publication via ChatService.send's KEY SHARE.
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM room_message WHERE attachment_id=?)", row.get("id")))
        continue;
      if (!Boolean.TRUE.equals(row.get("storedInline"))) {
        if (!storage.enabled()) continue;
        try {
          storage.delete((String) row.get("storageKey"));
        } catch (RuntimeException error) {
          continue;
        } // Retain metadata and retry next sweep.
      }
      db.jdbc.update("DELETE FROM room_attachment WHERE id=?", row.get("id"));
    }
  }
}
