package br.com.enturma.study;

import br.com.enturma.common.Db;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class RoomEvents {
  private final Db db;
  private final org.springframework.context.ApplicationEventPublisher events;

  public RoomEvents(Db db, org.springframework.context.ApplicationEventPublisher events) {
    this.db = db;
    this.events = events;
  }

  public void add(UUID room, UUID user, String kind, String message, String key) {
    int inserted =
        db.jdbc.update(
            "INSERT INTO room_system_event(id,room_id,user_id,kind,message,event_key) VALUES"
                + " (?,?,?,?,?,?) ON CONFLICT(room_id,event_key) DO NOTHING",
            UUID.randomUUID(),
            room,
            user,
            kind,
            message,
            key);
    if (inserted > 0) {
      var recipients = new HashSet<UUID>();
      for (var member :
          db.list("SELECT user_id FROM room_participant WHERE room_id=? AND NOT removed", room))
        recipients.add((UUID) member.get("userId"));
      if (!recipients.isEmpty())
        events.publishEvent(
            new br.com.enturma.notifications.AppChanged(
                kind.equals("WELCOME")
                    ? "room_member_joined"
                    : kind.equals("FAREWELL")
                        ? "room_member_left"
                        : kind.equals("EXPIRING") ? "room_expiring" : "rooms_changed",
                recipients));
    }
  }

  public Object list(UUID room) {
    return db.list(
        "SELECT e.*,u.name,u.username,u.avatar_bytes IS NOT NULL has_avatar,s.name"
            + " subject_name,r.topic_text,r.ends_at,h.name host_name FROM room_system_event e JOIN"
            + " study_room r ON r.id=e.room_id JOIN academic_entry s ON s.id=r.subject_id JOIN"
            + " app_user h ON h.id=r.host_id LEFT JOIN app_user u ON u.id=e.user_id WHERE"
            + " e.room_id=? ORDER BY e.created_at DESC LIMIT 50",
        room);
  }
}
