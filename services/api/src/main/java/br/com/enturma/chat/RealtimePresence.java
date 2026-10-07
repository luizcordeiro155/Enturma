package br.com.enturma.chat;

import br.com.enturma.common.Db;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/** Short leases from authenticated activity sockets, shared across API instances. */
@Service
public class RealtimePresence {
  private final Db db;

  public RealtimePresence(Db db) {
    this.db = db;
  }

  public void touch(String connection, UUID user) {
    db.jdbc.update(
        "INSERT INTO realtime_presence(connection_id,user_id,expires_at) VALUES (?,?,now()+interval"
            + " '65 seconds') ON CONFLICT(connection_id) DO UPDATE SET"
            + " expires_at=EXCLUDED.expires_at",
        connection,
        user);
  }

  public void remove(String connection) {
    db.jdbc.update("DELETE FROM realtime_presence WHERE connection_id=?", connection);
  }

  public boolean online(UUID user) {
    return db.exists(
        "SELECT EXISTS(SELECT 1 FROM realtime_presence WHERE user_id=? AND expires_at>now())",
        user);
  }

  @Scheduled(fixedDelay = 60000)
  public void expire() {
    db.jdbc.update("DELETE FROM realtime_presence WHERE expires_at<now()");
  }
}
