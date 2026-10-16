package br.com.enturma.notifications;

import br.com.enturma.common.Db;
import java.util.UUID;

/** Recheck delayed reminder deliveries after routine cancellation or trip changes. */
public final class NotificationDeliveryPolicy {
  private NotificationDeliveryPolicy() {}
  public static boolean current(Db db, String kind, UUID target) {
    if (!"RIDE_REMINDER_30".equals(kind)) return true;
    return db.exists("SELECT EXISTS(SELECT 1 FROM ride r WHERE r.id=? AND r.status='OPEN' AND r.departure_at>now() AND (r.recurrence_id IS NULL OR EXISTS(SELECT 1 FROM ride_recurrence rr WHERE rr.id=r.recurrence_id AND rr.active)))",target);
  }
  public static boolean currentEmail(Db db, Object dedupe) {
    if (!(dedupe instanceof String key) || !key.startsWith("RIDE_REMINDER_30:")) return true;
    try { return current(db, "RIDE_REMINDER_30", UUID.fromString(key.split(":")[1])); }
    catch (RuntimeException ex) { return false; }
  }
}
