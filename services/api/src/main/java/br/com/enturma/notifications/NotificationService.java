package br.com.enturma.notifications;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
  private final Db db;
  private final NotificationPreferences preferences;
  private final ApplicationEventPublisher events;

  public NotificationService(
      Db db, ApplicationEventPublisher events, NotificationPreferences preferences) {
    this.preferences = preferences;
    this.db = db;
    this.events = events;
  }

  public void forumChanged() {
    events.publishEvent(new AppChanged("forum_changed", Set.of()));
  }

  public void changed(UUID user) {
    events.publishEvent(new AppChanged("notifications_changed", Set.of(user)));
  }

  public Set<UUID> mentions(String text) {
    Set<UUID> found = new HashSet<>();
    var matcher =
        Pattern.compile(
                "(?<![\\p{L}\\p{M}\\p{N}_@])@([\\p{L}\\p{M}\\p{N}_]{1,40})(?![\\p{L}\\p{M}\\p{N}_])")
            .matcher(text == null ? "" : text);
    Set<String> names = new HashSet<>();
    while (matcher.find() && names.size() < 20)
      names.add(
          java.text.Normalizer.normalize(
              matcher.group(1).toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFC));
    for (String name : names)
      for (var row : db.list("SELECT id FROM app_user WHERE username=? AND status='ACTIVE'", name))
        found.add((UUID) row.get("id"));
    return found;
  }

  public void send(
      UUID actor,
      UUID user,
      String kind,
      String context,
      UUID target,
      String href,
      String message) {
    if (Objects.equals(actor, user)) return;
    if (actor != null
        && db.exists(
            "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR"
                + " (user_id=? AND blocked_id=?))",
            actor,
            user,
            user,
            actor)) return;
    String category = preferences.category(kind, context);
    String dedupe = kind + ":" + target + ":" + actor;
    preferences.queue(user, category, dedupe, message);

    if (preferences.pushEnabled(user, category)) {
      int pushInserted =
          db.jdbc.update(
              "INSERT INTO notification_push_delivery(id,user_id,dedupe_key) VALUES (?,?,?)"
                  + " ON CONFLICT(user_id,dedupe_key) DO NOTHING",
              UUID.randomUUID(),
              user,
              dedupe);
      if (pushInserted > 0) {
        db.jdbc.update(
            "INSERT INTO notification_desktop_push_event"
                + "(user_id,actor_id,category,kind,target_id,href,message,dedupe_key)"
                + " VALUES (?,?,?,?,?,?,?,?)"
                + " ON CONFLICT(user_id,dedupe_key) DO NOTHING",
            user,
            actor,
            category,
            kind,
            target,
            href,
            message == null ? "Você tem uma nova notificação." : message,
            dedupe);
        events.publishEvent(
            new PushRequested(user, actor, category, kind, target, href, message));
      }
    }

    if (preferences.enabled(user, category, false)) {
      int inserted =
          db.jdbc.update(
              "INSERT INTO"
                  + " notification(id,user_id,actor_id,kind,context_key,target_id,href,message,dedupe_key)"
                  + " SELECT ?,u.id,?,?,?,?,?,?,? FROM app_user u WHERE u.id=? AND u.status='ACTIVE'"
                  + " AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND"
                  + " b.blocked_id=?) OR (b.user_id=? AND b.blocked_id=?)) ON"
                  + " CONFLICT(user_id,dedupe_key) DO NOTHING",
              UUID.randomUUID(),
              actor,
              kind,
              context,
              target,
              href,
              message,
              dedupe,
              user,
              actor,
              user,
              user,
              actor);
      if (inserted > 0) changed(user);
    }
  }

  public void forumMentions(UUID actor, UUID root, UUID target, String body) {
    for (UUID user : mentions(body)) {
      var post = db.one("SELECT author_id FROM forum_entry WHERE id=?", root);
      UUID owner = (UUID) post.get("authorId");
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR (user_id=?"
              + " AND blocked_id=?))",
          owner,
          user,
          user,
          owner)) continue;
      send(
          actor,
          user,
          "MENTION",
          "forum:" + root,
          target,
          "/forum/" + root + "#entry-" + target,
          "Você foi mencionado em uma conversa do fórum.");
    }
  }

  private String visible() {
    return " n.user_id=? AND n.dismissed_at IS NULL AND NOT EXISTS(SELECT 1 FROM user_block b WHERE"
        + " (b.user_id=n.user_id AND b.blocked_id=n.actor_id) OR (b.blocked_id=n.user_id AND"
        + " b.user_id=n.actor_id))";
  }

  public Object inbox(Actor a) {
    var rows =
        db.list(
            "SELECT n.*,u.name actor_name FROM notification n LEFT JOIN app_user u ON"
                + " u.id=n.actor_id WHERE "
                + visible()
                + " ORDER BY (n.read_at IS NULL) DESC,n.created_at DESC,n.id LIMIT 80",
            a.id());
    Long unread =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM notification n WHERE " + visible() + " AND n.read_at IS NULL",
            Long.class,
            a.id());
    return Map.of("items", rows, "unreadCount", unread);
  }

  public Object desktopPush(Actor a, Long after) {
    if (after == null) {
      Long cursor =
          db.jdbc.queryForObject(
              "SELECT coalesce(max(sequence),0) FROM notification_desktop_push_event"
                  + " WHERE user_id=?",
              Long.class,
              a.id());
      return Map.of("items", List.of(), "cursor", cursor == null ? 0L : cursor);
    }

    long safeAfter = Math.max(0L, after);
    var rows =
        db.list(
            "SELECT e.sequence,e.category,e.kind,e.target_id,e.href,e.message,e.created_at,"
                + " u.name actor_name FROM notification_desktop_push_event e"
                + " LEFT JOIN app_user u ON u.id=e.actor_id"
                + " WHERE e.user_id=? AND e.sequence>? AND"
                + " e.created_at>now()-interval '30 days'"
                + " ORDER BY e.sequence LIMIT 100",
            a.id(),
            safeAfter);

    long cursor = safeAfter;
    var items = new ArrayList<Map<String, Object>>();
    for (var row : rows) {
      long sequence = ((Number) row.get("sequence")).longValue();
      cursor = Math.max(cursor, sequence);
      var item = new LinkedHashMap<String, Object>(row);
      item.put(
          "title",
          NotificationPresentation.title(
              String.valueOf(row.get("kind")),
              row.get("actorName") == null ? "" : String.valueOf(row.get("actorName"))));
      items.add(item);
    }
    return Map.of("items", items, "cursor", cursor);
  }

  @org.springframework.scheduling.annotation.Scheduled(
      fixedDelay = 21600000,
      initialDelay = 120000)
  public void cleanupDesktopPush() {
    db.jdbc.update(
        "DELETE FROM notification_desktop_push_event"
            + " WHERE created_at<now()-interval '30 days'");
  }

  @Transactional
  public void clear(Actor a) {
    db.jdbc.update(
        "UPDATE notification SET dismissed_at=now(),read_at=coalesce(read_at,now()) WHERE user_id=?"
            + " AND dismissed_at IS NULL",
        a.id());
    changed(a.id());
  }

  @Transactional
  public void read(Actor a, List<UUID> ids, String context, boolean all) {
    if (all)
      db.jdbc.update(
          "UPDATE notification SET read_at=coalesce(read_at,now()) WHERE user_id=? AND read_at IS"
              + " NULL",
          a.id());
    else if (context != null)
      db.jdbc.update(
          "UPDATE notification SET read_at=now() WHERE user_id=? AND context_key=? AND read_at IS"
              + " NULL",
          a.id(),
          context);
    else if (ids != null)
      for (UUID id : ids)
        db.jdbc.update(
            "UPDATE notification SET read_at=now() WHERE id=? AND user_id=? AND read_at IS NULL",
            id,
            a.id());
    changed(a.id());
  }
}
