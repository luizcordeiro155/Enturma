package br.com.enturma.privacy;

import br.com.enturma.common.Db;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Deletes personal data that outlived its purpose (LGPD art. 15 and 16). Each period here is the one
 * published in the Privacy Policy; change both together.
 */
@Service
public class DataRetention {
  private static final Logger log = LoggerFactory.getLogger(DataRetention.class);
  private final Db db;

  public DataRetention(Db db) {
    this.db = db;
  }

  @Scheduled(cron = "0 17 4 * * *", zone = "America/Sao_Paulo")
  public void run() {
    int limits = db.jdbc.update("DELETE FROM rate_limit WHERE resets_at<now()-interval '1 day'");
    // Ended sessions keep only 30 days, for account security reviews.
    int sessions =
        db.jdbc.update(
            "DELETE FROM user_session WHERE (revoked_at IS NOT NULL AND revoked_at<now()-interval '30"
                + " days') OR expires_at<now()-interval '30 days'");
    int tokens = db.jdbc.update("DELETE FROM account_token WHERE expires_at<now()-interval '1 day'");
    // Sent e-mails carry addresses and one-time links; undelivered ones stop being useful too.
    int mails =
        db.jdbc.update(
            "DELETE FROM email_outbox WHERE (sent_at IS NOT NULL AND sent_at<now()-interval '30 days')"
                + " OR created_at<now()-interval '90 days'");
    int notices =
        db.jdbc.update(
            "DELETE FROM notification WHERE (read_at IS NOT NULL AND created_at<now()-interval '180"
                + " days') OR created_at<now()-interval '365 days'");
    log.info(
        "retention removed rate_limit={} sessions={} tokens={} emails={} notifications={}",
        limits,
        sessions,
        tokens,
        mails,
        notices);
  }
}
