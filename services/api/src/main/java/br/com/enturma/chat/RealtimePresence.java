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

  /** One write a minute per person is enough for "last seen"; the lease itself is renewed each time. */
  private static final long SEEN_INTERVAL_MS = 60_000;

  private final java.util.concurrent.ConcurrentHashMap<UUID, Long> seen =
      new java.util.concurrent.ConcurrentHashMap<>();

  public void touch(String connection, UUID user) {
    db.jdbc.update(
        "INSERT INTO realtime_presence(connection_id,user_id,expires_at) VALUES (?,?,now()+interval"
            + " '65 seconds') ON CONFLICT(connection_id) DO UPDATE SET"
            + " expires_at=EXCLUDED.expires_at",
        connection,
        user);
    long now = System.currentTimeMillis();
    Long previous = seen.get(user);
    if (previous != null && now - previous < SEEN_INTERVAL_MS) return;
    if (seen.size() > 20_000) seen.clear();
    seen.put(user, now);
    db.jdbc.update("UPDATE app_user SET last_seen_at=now() WHERE id=?", user);
  }

  /** Leaving is the moment someone was last seen. */
  public void remove(String connection) {
    db.jdbc.update(
        "UPDATE app_user SET last_seen_at=now() WHERE id=(SELECT user_id FROM realtime_presence"
            + " WHERE connection_id=?)",
        connection);
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
