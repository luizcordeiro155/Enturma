package br.com.enturma.notifications;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.UUID;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Utils;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class WebPushNotificationService {
  private final Db db;
  private final NotificationPreferences preferences;
  private final ObjectMapper json;
  private final String appUrl;
  private final Object keyLock = new Object();

  static {
    if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
      Security.addProvider(new BouncyCastleProvider());
    }
  }

  public WebPushNotificationService(
      Db db,
      NotificationPreferences preferences,
      ObjectMapper json,
      @Value("${enturma.app-url}") String appUrl) {
    this.db = db;
    this.preferences = preferences;
    this.json = json;
    this.appUrl = appUrl;
  }

  public String publicKey() {
    return keys().publicKey();
  }

  @Transactional
  public void register(
      Actor actor,
      String installationId,
      String endpoint,
      String p256dh,
      String auth) {
    if (endpoint == null || !endpoint.startsWith("https://")) {
      throw ApiException.invalid("Endpoint de push inválido.");
    }

    db.jdbc.update(
        "DELETE FROM notification_web_push_subscription WHERE endpoint=?"
            + " AND (user_id<>? OR installation_id<>?)",
        endpoint,
        actor.id(),
        installationId);

    db.jdbc.update(
        "INSERT INTO notification_web_push_subscription"
            + "(id,user_id,installation_id,endpoint,p256dh,auth,enabled,created_at,updated_at,last_seen_at)"
            + " VALUES (?,?,?,?,?,?,true,now(),now(),now())"
            + " ON CONFLICT(user_id,installation_id) DO UPDATE SET"
            + " endpoint=EXCLUDED.endpoint,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,"
            + " enabled=true,updated_at=now(),last_seen_at=now()",
        UUID.randomUUID(),
        actor.id(),
        installationId,
        endpoint,
        p256dh,
        auth);
  }

  @Transactional
  public void unregister(Actor actor, String installationId) {
    db.jdbc.update(
        "DELETE FROM notification_web_push_subscription"
            + " WHERE user_id=? AND installation_id=?",
        actor.id(),
        installationId);
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void deliver(PushRequested event) {
    if (!preferences.pushEnabled(event.user(), event.category())) return;

    var subscriptions =
        db.list(
            "SELECT id,endpoint,p256dh,auth FROM notification_web_push_subscription"
                + " WHERE user_id=? AND enabled",
            event.user());
    if (subscriptions.isEmpty()) return;

    try {
      Keys keys = keys();
      PushService service = new PushService(keys.publicKey(), keys.privateKey(), appUrl);
      String title = NotificationPresentation.title(event.kind(), actorName(event.actor()));
      var payload = new LinkedHashMap<String, Object>();
      payload.put("title", title);
      payload.put(
          "body",
          event.message() == null ? "Você tem uma nova notificação." : event.message());
      payload.put("href", safeHref(event.href()));
      payload.put("kind", event.kind() == null ? "SYSTEM" : event.kind());
      payload.put("icon", "/pwa/enturma-mobile-official-v6.png");
      payload.put("badge", "/pwa/enturma-mobile-official-v6.png");
      payload.put("unreadCount", unread(event.user()));
      String body = json.writeValueAsString(payload);

      for (var row : subscriptions) {
        UUID id = (UUID) row.get("id");
        try {
          Notification notification =
              new Notification(
                  String.valueOf(row.get("endpoint")),
                  String.valueOf(row.get("p256dh")),
                  String.valueOf(row.get("auth")),
                  body.getBytes(StandardCharsets.UTF_8));
          var response = service.send(notification);
          int status = response.getStatusLine().getStatusCode();
          if (status == 404 || status == 410) {
            db.jdbc.update(
                "UPDATE notification_web_push_subscription"
                    + " SET enabled=false,updated_at=now() WHERE id=?",
                id);
          } else if (status >= 200 && status < 300) {
            db.jdbc.update(
                "UPDATE notification_web_push_subscription"
                    + " SET last_seen_at=now() WHERE id=?",
                id);
          }
        } catch (Exception ignored) {
          // Uma falha de push nunca invalida a notificação criada no Enturma.
        }
      }
    } catch (Exception ignored) {
      // Notificações in-app e Android continuam funcionando mesmo se Web Push falhar.
    }
  }

  private long unread(UUID user) {
    Long value =
        db.jdbc.queryForObject(
            "SELECT count(*) FROM notification"
                + " WHERE user_id=? AND dismissed_at IS NULL AND read_at IS NULL",
            Long.class,
            user);
    return value == null ? 0 : value;
  }

  private String actorName(UUID actor) {
    if (actor == null) return "";
    var rows = db.list("SELECT name FROM app_user WHERE id=? AND status='ACTIVE'", actor);
    return rows.isEmpty() ? "" : String.valueOf(rows.getFirst().get("name"));
  }


  private String safeHref(String href) {
    if (href == null || !href.startsWith("/") || href.startsWith("//")) {
      return "/notifications";
    }
    return href.length() > 250 ? "/notifications" : href;
  }

  private Keys keys() {
    synchronized (keyLock) {
      var rows = db.list("SELECT public_key,private_key FROM web_push_vapid_key WHERE id=1");
      if (!rows.isEmpty()) {
        return new Keys(
            String.valueOf(rows.getFirst().get("publicKey")),
            String.valueOf(rows.getFirst().get("privateKey")));
      }

      try {
        var spec = ECNamedCurveTable.getParameterSpec("prime256v1");
        var generator =
            KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
        generator.initialize(spec);
        KeyPair pair = generator.generateKeyPair();
        String publicKey =
            Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(Utils.encode((ECPublicKey) pair.getPublic()));
        String privateKey =
            Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(Utils.encode((ECPrivateKey) pair.getPrivate()));

        db.jdbc.update(
            "INSERT INTO web_push_vapid_key(id,public_key,private_key)"
                + " VALUES (1,?,?) ON CONFLICT(id) DO NOTHING",
            publicKey,
            privateKey);
        rows = db.list("SELECT public_key,private_key FROM web_push_vapid_key WHERE id=1");
        return new Keys(
            String.valueOf(rows.getFirst().get("publicKey")),
            String.valueOf(rows.getFirst().get("privateKey")));
      } catch (Exception e) {
        throw new IllegalStateException("Não foi possível preparar Web Push.", e);
      }
    }
  }

  private record Keys(String publicKey, String privateKey) {}
}
