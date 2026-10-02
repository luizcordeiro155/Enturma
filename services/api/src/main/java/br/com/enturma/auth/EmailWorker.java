package br.com.enturma.auth;

import br.com.enturma.common.Db;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EmailWorker {
  private final Db db;
  private final JavaMailSender sender;
  private final String from;
  private final boolean enabled;

  public EmailWorker(
      Db db,
      JavaMailSender sender,
      @Value("${enturma.mail-from}") String from,
      @Value("${enturma.mail-enabled:false}") boolean enabled) {
    this.db = db;
    this.sender = sender;
    this.from = from;
    this.enabled = enabled;
  }

  @Scheduled(fixedDelay = 5000)
  @Transactional
  public void deliver() {
    if (!enabled) return;
    for (var row :
        db.list(
            "SELECT * FROM email_outbox WHERE sent_at IS NULL AND attempts<10 ORDER BY created_at"
                + " LIMIT 10 FOR UPDATE SKIP LOCKED")) {
      if (row.get("category") != null
          && !db.exists(
              "SELECT EXISTS(SELECT 1 FROM notification_preference WHERE user_id=? AND category=?"
                  + " AND email)",
              row.get("userId"),
              row.get("category"))) {
        db.jdbc.update("UPDATE email_outbox SET sent_at=now(),body='' WHERE id=?", row.get("id"));
        continue;
      }
      try {
        var mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo((String) row.get("recipient"));
        mail.setSubject((String) row.get("subject"));
        mail.setText((String) row.get("body"));
        sender.send(mail);
        db.jdbc.update("UPDATE email_outbox SET sent_at=now(),body='' WHERE id=?", row.get("id"));
      } catch (org.springframework.mail.MailException e) {
        db.jdbc.update("UPDATE email_outbox SET attempts=attempts+1 WHERE id=?", row.get("id"));
      }
    }
  }
}
