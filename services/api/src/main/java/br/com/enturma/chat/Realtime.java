package br.com.enturma.chat;

import br.com.enturma.auth.*;
import br.com.enturma.study.StudyService;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Configuration
@EnableWebSocket
public class Realtime extends TextWebSocketHandler implements WebSocketConfigurer {
  private final AuthService auth;
  private final StudyService study;
  private final Db db;
  private final ObjectMapper json;
  private final String[] origins;
  private final Map<String, Connection> connections = new ConcurrentHashMap<>();

  private static final Set<String> RELAY_TYPES =
      Set.of("key_request", "key_offer", "encrypted_event");

  private static class Connection {
    final WebSocketSession socket;
    final long opened = System.currentTimeMillis();
    UUID room;
    Actor actor;
    String name;
    JsonNode publicKey;

    Connection(WebSocketSession socket) {
      this.socket = socket;
    }

    boolean authenticated() {
      return actor != null && room != null && publicKey != null;
    }
  }

  public Realtime(
      AuthService auth,
      StudyService study,
      Db db,
      ObjectMapper json,
      @Value("${enturma.origins}") String origins) {
    this.auth = auth;
    this.study = study;
    this.db = db;
    this.json = json;
    this.origins = origins.split(",");
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(this, "/ws").setAllowedOrigins(origins);
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession socket) throws Exception {
    if (connections.size() >= 2000) {
      socket.close(CloseStatus.SERVICE_OVERLOAD);
      return;
    }
    // Up to 8 MiB images plus base64/AES-GCM/JSON overhead. Chat remains ephemeral in memory.
    socket.setTextMessageSizeLimit(12_000_000);
    connections.put(socket.getId(), new Connection(socket));
  }

  @Override
  protected void handleTextMessage(WebSocketSession socket, TextMessage message) throws Exception {
    Connection c = connections.get(socket.getId());
    if (c == null) {
      socket.close(CloseStatus.POLICY_VIOLATION);
      return;
    }

    JsonNode data;
    try {
      data = json.readTree(message.getPayload());
    } catch (Exception e) {
      socket.close(CloseStatus.BAD_DATA);
      return;
    }

    if (!c.authenticated()) {
      authenticate(c, data);
      return;
    }

    String type = data.path("type").asText("");
    if (!RELAY_TYPES.contains(type)) {
      socket.close(CloseStatus.POLICY_VIOLATION);
      return;
    }

    // The server intentionally does not inspect or persist encrypted_event payloads.
    if ("encrypted_event".equals(type)) {
      String iv = data.path("iv").asText("");
      String ciphertext = data.path("ciphertext").asText("");
      String id = data.path("id").asText("");
      if (iv.length() > 64 || ciphertext.isBlank() || ciphertext.length() > 11_500_000 || id.length() > 80) {
        socket.close(CloseStatus.TOO_BIG_TO_PROCESS);
        return;
      }
      relay(
          c,
          null,
          Map.of(
              "type", "encrypted_event",
              "id", id,
              "senderId", c.actor.id().toString(),
              "iv", iv,
              "ciphertext", ciphertext));
      return;
    }

    if ("key_request".equals(type)) {
      relay(
          c,
          null,
          Map.of(
              "type", "key_request",
              "senderId", c.actor.id().toString(),
              "publicKey", c.publicKey));
      return;
    }

    String targetId = data.path("targetId").asText("");
    String iv = data.path("iv").asText("");
    String ciphertext = data.path("ciphertext").asText("");
    if (targetId.isBlank() || iv.length() > 64 || ciphertext.isBlank() || ciphertext.length() > 2048) {
      socket.close(CloseStatus.BAD_DATA);
      return;
    }
    relay(
        c,
        targetId,
        Map.of(
            "type", "key_offer",
            "senderId", c.actor.id().toString(),
            "senderPublicKey", c.publicKey,
            "iv", iv,
            "ciphertext", ciphertext));
  }

  private void authenticate(Connection c, JsonNode data) throws Exception {
    if (!"auth".equals(data.path("type").asText())) {
      c.socket.close(CloseStatus.POLICY_VIOLATION);
      return;
    }
    try {
      String token = data.path("token").asText();
      UUID room = UUID.fromString(data.path("roomId").asText());
      JsonNode publicKey = data.path("publicKey");
      if (!publicKey.isObject() || publicKey.toString().length() > 1500)
        throw new IllegalArgumentException("invalid public key");

      Actor actor = auth.authenticate(token).orElseThrow();
      study.member(actor, room);
      var detail = study.detail(actor, room);
      String name =
          String.valueOf(db.one("SELECT name FROM app_user WHERE id=?", actor.id()).get("name"));

      c.actor = actor;
      c.room = room;
      c.publicKey = publicKey.deepCopy();
      c.name = name;

      List<Map<String, Object>> peers = new ArrayList<>();
      for (Connection peer : connections.values()) {
        if (peer == c || !peer.authenticated() || !room.equals(peer.room)) continue;
        peers.add(
            Map.of(
                "userId", peer.actor.id().toString(),
                "name", peer.name,
                "publicKey", peer.publicKey));
      }

      send(
          c,
          Map.of(
              "type", "ready",
              "room", detail,
              "peers", peers,
              "privacy", "E2EE_EPHEMERAL"));

      relay(
          c,
          null,
          Map.of(
              "type", "peer_joined",
              "userId", actor.id().toString(),
              "name", c.name,
              "publicKey", c.publicKey));
    } catch (Exception e) {
      c.socket.close(CloseStatus.POLICY_VIOLATION);
    }
  }

  private void relay(Connection sender, String targetId, Object payload) {
    for (Connection target : connections.values()) {
      if (target == sender || !target.authenticated() || !sender.room.equals(target.room)) continue;
      if (targetId != null && !target.actor.id().toString().equals(targetId)) continue;
      try {
        send(target, payload);
      } catch (Exception e) {
        try {
          target.socket.close(CloseStatus.SERVER_ERROR);
        } catch (Exception ignored) {
        }
        connections.remove(target.socket.getId());
      }
    }
  }

  private void send(Connection c, Object payload) throws Exception {
    synchronized (c) {
      if (c.socket.isOpen())
        c.socket.sendMessage(new TextMessage(json.writeValueAsString(payload)));
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession socket, CloseStatus status) {
    Connection c = connections.remove(socket.getId());
    if (c == null || !c.authenticated()) return;
    relay(
        c,
        null,
        Map.of(
            "type", "peer_left",
            "userId", c.actor.id().toString()));
  }
}
