package br.com.enturma.community;

import br.com.enturma.common.Db;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AchievementWorker {
  private final Db db;
  private final AchievementService service;

  public AchievementWorker(Db db, AchievementService service) {
    this.db = db;
    this.service = service;
  }

  @Scheduled(fixedDelay = 5000)
  public void update() {
    for (var row :
        db.list(
            "DELETE FROM achievement_sync_queue WHERE user_id IN (SELECT user_id FROM"
                + " achievement_sync_queue WHERE queued_at<now()-interval '3 seconds' ORDER BY"
                + " queued_at FOR UPDATE SKIP LOCKED LIMIT 20) RETURNING user_id")) {
      UUID user = (UUID) row.get("userId");
      try {
        service.sync(user);
      } catch (Exception e) {
        db.jdbc.update(
            "INSERT INTO achievement_sync_queue(user_id,queued_at) VALUES (?,now()+interval '1"
                + " minute') ON CONFLICT DO NOTHING",
            user);
        org.slf4j.LoggerFactory.getLogger(getClass())
            .warn("Achievement processing deferred for {}: {}", user, e.getClass().getSimpleName());
      }
    }
  }
}
