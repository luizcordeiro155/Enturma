package br.com.enturma.chat;

import br.com.enturma.auth.*;
import br.com.enturma.common.Db;
import br.com.enturma.study.StudyService;
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
  private final ChatService chat;
  private final Db db;
  private final ObjectMapper json;
  private final String[] origins;
  private final Map<String, Connection> connections = new ConcurrentHashMap<>();

  private static class Connection {
    final WebSocketSession socket;
    UUID room;
    Actor actor;
    String name;

    Connection(WebSocketSession socket) {
      this.socket = socket;
    }

    boolean authenticated() {
      return actor != null && room != null;
    }
  }

  public Realtime(
      AuthService auth,
      StudyService study,
      ChatService chat,
      Db db,
      ObjectMapper json,
      @Value("$" + "{enturma.origins}") String origins) {
    this.auth = auth;
    this.study = study;
    this.chat = chat;
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

    try {
      switch (data.path("type").asText("")) {
        case "chat_message" -> {
          UUID id = optionalUuid(data.path("id").asText(""));
          UUID replyTo = optionalUuid(data.path("replyTo").asText(""));
          String body =
              data.path("body").isMissingNode() || data.path("body").isNull()
                  ? null
                  : data.path("body").asText();

          ChatService.ImagePayload image = null;
          JsonNode imageNode = data.path("image");
          if (imageNode.isObject()) {
            image =
                new ChatService.ImagePayload(
                    imageNode.path("name").asText("imagem"),
                    imageNode.path("mime").asText(""),
                    imageNode.path("size").isNumber() ? imageNode.path("size").asInt() : null,
                    imageNode.path("dataUrl").asText(""));
          }

          var saved = chat.send(c.actor, c.room, id, body, replyTo, image);
          broadcast(c.room, Map.of("type", "message", "message", saved), null);
        }
        case "chat_delete" -> {
          UUID id = requiredUuid(data.path("messageId").asText(""));
          chat.delete(c.actor, c.room, id);
          broadcast(c.room, Map.of("type", "delete", "messageId", id.toString()), null);
        }
        case "chat_reaction" -> {
          UUID id = requiredUuid(data.path("messageId").asText(""));
          String emoji = data.path("emoji").asText("");
          boolean active = data.path("active").asBoolean(false);
          chat.setReaction(c.actor, c.room, id, emoji, active);
          broadcast(
              c.room,
              Map.of(
                  "type", "reaction",
                  "messageId", id.toString(),
                  "emoji", emoji,
                  "active", active,
                  "userId", c.actor.id().toString()),
              null);
        }
        case "typing" ->
            broadcast(
                c.room,
                Map.of(
                    "type", "typing",
                    "userId", c.actor.id().toString(),
                    "name", c.name,
                    "active", data.path("active").asBoolean(false)),
                c);
        default -> socket.close(CloseStatus.POLICY_VIOLATION);
      }
    } catch (Exception e) {
      send(
          c,
          Map.of(
              "type", "error",
              "message",
              e.getMessage() == null ? "Não foi possível atualizar a sala." : e.getMessage()));
    }
  }

  private void authenticate(Connection c, JsonNode data) throws Exception {
    if (!"auth".equals(data.path("type").asText(""))) {
      c.socket.close(CloseStatus.POLICY_VIOLATION);
      return;
    }
    try {
      Actor actor = auth.authenticate(data.path("token").asText()).orElseThrow();
      UUID room = UUID.fromString(data.path("roomId").asText());
      study.member(actor, room);

      c.actor = actor;
      c.room = room;
      c.name = String.valueOf(db.one("SELECT name FROM app_user WHERE id=?", actor.id()).get("name"));

      List<Map<String, Object>> online = new ArrayList<>();
      for (Connection peer : connections.values()) {
        if (peer == c || !peer.authenticated() || !room.equals(peer.room)) continue;
        online.add(Map.of("userId", peer.actor.id().toString(), "name", peer.name));
      }

      send(
          c,
          Map.of(
              "type", "ready",
              "room", study.detail(actor, room),
              "online", online,
              "history", "PERSISTENT_PRIVATE"));

      broadcast(
          room,
          Map.of(
              "type", "peer_joined",
              "userId", actor.id().toString(),
              "name", c.name),
          c);
    } catch (Exception e) {
      c.socket.close(CloseStatus.POLICY_VIOLATION);
    }
  }

  private void broadcast(UUID room, Object payload, Connection excluded) {
    for (Connection target : connections.values()) {
      if (target == excluded || !target.authenticated() || !room.equals(target.room)) continue;
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

  private UUID optionalUuid(String value) {
    if (value == null || value.isBlank()) return null;
    return requiredUuid(value);
  }

  private UUID requiredUuid(String value) {
    try {
      return UUID.fromString(value);
    } catch (Exception e) {
      throw new IllegalArgumentException("Identificador inválido.");
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession socket, CloseStatus status) {
    Connection c = connections.remove(socket.getId());
    if (c == null || !c.authenticated()) return;
    broadcast(
        c.room,
        Map.of(
            "type", "peer_left",
            "userId", c.actor.id().toString()),
        c);
  }
}
