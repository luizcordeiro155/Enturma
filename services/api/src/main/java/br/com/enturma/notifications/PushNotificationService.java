package br.com.enturma.notifications;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Service
public class PushNotificationService {
  private static final String FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
  private static final String OAUTH_AUDIENCE = "https://oauth2.googleapis.com/token";

  private final Db db;
  private final NotificationPreferences preferences;
  private final ObjectMapper json;
  private final HttpClient http;
  private final String serviceAccountBase64;
  private volatile ServiceAccount serviceAccount;
  private volatile Access access;

  public PushNotificationService(
      Db db,
      NotificationPreferences preferences,
      ObjectMapper json,
      @Value("${enturma.fcm-service-account-base64:}") String serviceAccountBase64) {
    this.db = db;
    this.preferences = preferences;
    this.json = json;
    this.serviceAccountBase64 = serviceAccountBase64 == null ? "" : serviceAccountBase64.strip();
    this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
  }

  public boolean configured() {
    return !serviceAccountBase64.isBlank();
  }

  @Transactional
  public void register(Actor actor, String installationId, String token, String platform) {
    if (!"ANDROID".equals(platform)) throw ApiException.invalid("Plataforma de push inválida.");
    db.jdbc.update(
        "DELETE FROM notification_push_device WHERE token=? AND"
            + " (user_id<>? OR installation_id<>?)",
        token,
        actor.id(),
        installationId);
    db.jdbc.update(
        "INSERT INTO notification_push_device"
            + "(id,user_id,installation_id,token,platform,enabled,created_at,updated_at,last_seen_at)"
            + " VALUES (?,?,?,?,?,true,now(),now(),now())"
            + " ON CONFLICT(user_id,installation_id) DO UPDATE SET"
            + " token=EXCLUDED.token,platform=EXCLUDED.platform,enabled=true,"
            + " updated_at=now(),last_seen_at=now()",
        UUID.randomUUID(),
        actor.id(),
        installationId,
        token,
        platform);
  }

  @Transactional
  public void unregister(Actor actor, String installationId) {
    db.jdbc.update(
        "DELETE FROM notification_push_device WHERE user_id=? AND installation_id=?",
        actor.id(),
        installationId);
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
  public void deliver(PushRequested event) {
    if (!configured() || !preferences.pushEnabled(event.user(), event.category())) return;

    String actorName = actorName(event.actor());
    String title = NotificationPresentation.title(event.kind(), actorName);
    for (var row :
        db.list(
            "SELECT d.id,d.token FROM notification_push_device d"
                + " JOIN app_user u ON u.id=d.user_id AND u.status='ACTIVE'"
                + " WHERE d.user_id=? AND d.platform='ANDROID' AND d.enabled",
            event.user())) {
      UUID device = (UUID) row.get("id");
      String token = (String) row.get("token");
      try {
        Delivery result = send(token, event, title);
        if (result == Delivery.INVALID_TOKEN) {
          db.jdbc.update(
              "UPDATE notification_push_device SET enabled=false,updated_at=now() WHERE id=?",
              device);
        } else if (result == Delivery.OK) {
          db.jdbc.update(
              "UPDATE notification_push_device SET last_seen_at=now() WHERE id=?",
              device);
        }
      } catch (Exception ignored) {
        // Push nunca pode invalidar a transação que criou a notificação no Enturma.
      }
    }
  }

  private String actorName(UUID actor) {
    if (actor == null) return "";
    var rows = db.list("SELECT name FROM app_user WHERE id=? AND status='ACTIVE'", actor);
    return rows.isEmpty() ? "" : String.valueOf(rows.getFirst().get("name"));
  }


  private Delivery send(String deviceToken, PushRequested event, String title) throws Exception {
    Map<String, String> data = new HashMap<>();
    data.put("title", title);
    data.put("body", event.message() == null ? "Você tem uma nova notificação." : event.message());
    data.put("href", safeHref(event.href()));
    data.put("kind", event.kind() == null ? "SYSTEM" : event.kind());
    data.put("category", event.category() == null ? "ROOM_NOTICE" : event.category());
    data.put("showInForeground", Boolean.toString(!preferences.enabled(event.user(), event.category(), false)));
    if (event.target() != null) data.put("notificationId", event.target().toString());

    Map<String, Object> message = new HashMap<>();
    message.put("token", deviceToken);
    message.put("data", data);
    message.put("android", Map.of("priority", "HIGH", "ttl", "86400s"));

    String body = json.writeValueAsString(Map.of("message", message));
    ServiceAccount account = serviceAccount();
    HttpRequest request =
        HttpRequest.newBuilder(
                URI.create(
                    "https://fcm.googleapis.com/v1/projects/"
                        + account.projectId()
                        + "/messages:send"))
            .timeout(Duration.ofSeconds(12))
            .header("Authorization", "Bearer " + accessToken(account))
            .header("Content-Type", "application/json; charset=utf-8")
            .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
            .build();
    HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() >= 200 && response.statusCode() < 300) return Delivery.OK;

    String responseBody = response.body() == null ? "" : response.body();
    if (response.statusCode() == 404
        || responseBody.contains("UNREGISTERED")
        || responseBody.contains("registration-token-not-registered")) {
      return Delivery.INVALID_TOKEN;
    }
    return Delivery.FAILED;
  }

  private String safeHref(String href) {
    if (href == null || !href.startsWith("/") || href.startsWith("//")) return "/notifications";
    return href.length() > 250 ? "/notifications" : href;
  }

  private ServiceAccount serviceAccount() throws Exception {
    ServiceAccount current = serviceAccount;
    if (current != null) return current;
    synchronized (this) {
      if (serviceAccount != null) return serviceAccount;
      byte[] decoded = Base64.getDecoder().decode(serviceAccountBase64);
      JsonNode node = json.readTree(decoded);
      String project = node.path("project_id").asText("");
      String email = node.path("client_email").asText("");
      String pem = node.path("private_key").asText("");
      if (project.isBlank() || email.isBlank() || pem.isBlank())
        throw new IllegalStateException("Credencial FCM incompleta.");

      String key =
          pem.replace("-----BEGIN PRIVATE KEY-----", "")
              .replace("-----END PRIVATE KEY-----", "")
              .replaceAll("\\s", "");
      PrivateKey privateKey =
          KeyFactory.getInstance("RSA")
              .generatePrivate(new PKCS8EncodedKeySpec(Base64.getDecoder().decode(key)));
      serviceAccount = new ServiceAccount(project, email, privateKey);
      return serviceAccount;
    }
  }

  private String accessToken(ServiceAccount account) throws Exception {
    Access current = access;
    if (current != null && current.expiresAt().isAfter(Instant.now().plusSeconds(90)))
      return current.value();

    synchronized (this) {
      current = access;
      if (current != null && current.expiresAt().isAfter(Instant.now().plusSeconds(90)))
        return current.value();

      long now = Instant.now().getEpochSecond();
      String header = base64Url(json.writeValueAsBytes(Map.of("alg", "RS256", "typ", "JWT")));
      String claims =
          base64Url(
              json.writeValueAsBytes(
                  Map.of(
                      "iss", account.clientEmail(),
                      "scope", FCM_SCOPE,
                      "aud", OAUTH_AUDIENCE,
                      "iat", now,
                      "exp", now + 3500)));
      String unsigned = header + "." + claims;
      Signature signer = Signature.getInstance("SHA256withRSA");
      signer.initSign(account.privateKey());
      signer.update(unsigned.getBytes(StandardCharsets.UTF_8));
      String assertion = unsigned + "." + base64Url(signer.sign());

      String form =
          "grant_type="
              + URLEncoder.encode(
                  "urn:ietf:params:oauth:grant-type:jwt-bearer", StandardCharsets.UTF_8)
              + "&assertion="
              + URLEncoder.encode(assertion, StandardCharsets.UTF_8);
      HttpRequest request =
          HttpRequest.newBuilder(URI.create(OAUTH_AUDIENCE))
              .timeout(Duration.ofSeconds(12))
              .header("Content-Type", "application/x-www-form-urlencoded")
              .POST(HttpRequest.BodyPublishers.ofString(form))
              .build();
      HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300)
        throw new IllegalStateException("Não foi possível autenticar no FCM.");

      JsonNode token = json.readTree(response.body());
      String value = token.path("access_token").asText("");
      long expires = token.path("expires_in").asLong(3600);
      if (value.isBlank()) throw new IllegalStateException("FCM não retornou access_token.");
      access = new Access(value, Instant.now().plusSeconds(Math.max(300, expires)));
      return value;
    }
  }

  private String base64Url(byte[] bytes) {
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private enum Delivery {
    OK,
    INVALID_TOKEN,
    FAILED
  }

  private record ServiceAccount(String projectId, String clientEmail, PrivateKey privateKey) {}

  private record Access(String value, Instant expiresAt) {}
}
