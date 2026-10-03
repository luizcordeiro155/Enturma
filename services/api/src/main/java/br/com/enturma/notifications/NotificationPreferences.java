package br.com.enturma.notifications;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationPreferences {
  public static final Set<String> CATEGORIES =
      Set.of("ROOM_MESSAGE", "PRIVATE_MESSAGE", "MENTION", "ROOM_NOTICE", "FORUM", "ACHIEVEMENT", "RIDE", "FRIEND");
  private final Db db;

  public NotificationPreferences(Db db) {
    this.db = db;
  }

  public String category(String kind, String context) {
    if (kind.equals("MENTION")) return "MENTION";
    if (kind.equals("PRIVATE_MESSAGE")) return "PRIVATE_MESSAGE";
    if (kind.equals("ACHIEVEMENT")) return "ACHIEVEMENT";
    if (context != null && context.startsWith("forum:")) return "FORUM";
    if (context != null && (context.startsWith("ride:") || context.startsWith("ride-match:")))
      return "RIDE";
    if (context != null && (context.startsWith("friend:") || context.startsWith("dm:")))
      return "FRIEND";
    return kind.equals("ROOM_MESSAGE") ? "ROOM_MESSAGE" : "ROOM_NOTICE";
  }

  public boolean enabled(UUID user, String category, boolean email) {
    var rows =
        db.list(
            "SELECT in_app,email,push FROM notification_preference WHERE user_id=? AND category=?",
            user,
            category);
    return rows.isEmpty()
        ? !email
        : Boolean.TRUE.equals(rows.getFirst().get(email ? "email" : "inApp"));
  }

  public boolean pushEnabled(UUID user, String category) {
    var rows =
        db.list(
            "SELECT push FROM notification_preference WHERE user_id=? AND category=?",
            user,
            category);
    return rows.isEmpty() || Boolean.TRUE.equals(rows.getFirst().get("push"));
  }

  public Object list(Actor a) {
    return CATEGORIES.stream()
        .sorted()
        .map(
            c ->
                Map.of(
                    "category",
                    c,
                    "inApp",
                    enabled(a.id(), c, false),
                    "email",
                    enabled(a.id(), c, true),
                    "push",
                    pushEnabled(a.id(), c)))
        .toList();
  }

  public void save(Actor a, String category, boolean inApp, boolean email) {
    save(a, category, inApp, email, null);
  }

  @Transactional
  public void save(Actor a, String category, boolean inApp, boolean email, Boolean push) {
    if (!CATEGORIES.contains(category)) throw ApiException.invalid("Categoria inválida.");
    boolean pushValue = push == null ? pushEnabled(a.id(), category) : push;
    db.jdbc.update(
        "INSERT INTO notification_preference(user_id,category,in_app,email,push) VALUES (?,?,?,?,?) ON"
            + " CONFLICT(user_id,category) DO UPDATE SET"
            + " in_app=EXCLUDED.in_app,email=EXCLUDED.email,push=EXCLUDED.push",
        a.id(),
        category,
        inApp,
        email,
        pushValue);
  }

  public void queue(UUID user, String category, String key, String message) {
    if (!enabled(user, category, true)) return;
    db.jdbc.update(
        "INSERT INTO email_outbox(id,recipient,subject,body,user_id,category,dedupe_key) SELECT"
            + " ?,email,'Novidade no Enturma',?,?,?,? FROM app_user WHERE id=? AND status='ACTIVE'"
            + " AND email_verified ON CONFLICT(user_id,dedupe_key) DO NOTHING",
        UUID.randomUUID(),
        message
            + "\n"
            + "Abra o Enturma para visualizar. Você pode ajustar estes avisos em Configurações →"
            + " Notificações.",
        user,
        category,
        key,
        user);
  }
}
