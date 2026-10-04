package br.com.enturma.chat;

import br.com.enturma.auth.*;
import br.com.enturma.study.StudyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.socket.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Configuration
@EnableWebSocket
public class Realtime extends TextWebSocketHandler implements WebSocketConfigurer {
  private final br.com.enturma.common.Db db;
  private final AuthService auth;
  private final ChatService chat;
  private final StudyService study;
  private final ObjectMapper json;
  private final String[] origins;
  private final Map<String, Connection> connections = new ConcurrentHashMap<>();

  private static class Connection {
    final WebSocketSession socket;
    final long opened = System.currentTimeMillis();
    volatile String token;
    volatile UUID room;
    volatile UUID user;
    volatile boolean rides;
    volatile boolean activity;
    String previous = "";
    String name = "";
    String typingPrevious = "";
    long typingUntil = 0, lastTyping = 0, lastHeartbeat = 0;

    Connection(WebSocketSession socket) {
      this.socket = socket;
    }
  }

  public Realtime(
      AuthService auth,
      br.com.enturma.common.Db db,
      ChatService chat,
      StudyService study,
      ObjectMapper json,
      @Value("${enturma.origins}") String origins) {
    this.db = db;
    this.auth = auth;
    this.chat = chat;
    this.study = study;
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
    socket.setTextMessageSizeLimit(4096);
    connections.put(socket.getId(), new Connection(socket));
  }

  @Override
  protected void handleTextMessage(WebSocketSession socket, TextMessage message) throws Exception {
    var c = connections.get(socket.getId());
    if (c != null && c.token != null) {
      try {
        var data = json.readTree(message.getPayload());
        Actor actor = auth.authenticate(c.token).orElseThrow();
        if (c.room == null) return;
        study.member(actor, c.room);
        String type = data.path("type").asText();
        long now = System.currentTimeMillis();
        if (type.equals("typing_stopped")) c.typingUntil = 0;
        else if (type.equals("typing_started") && now - c.lastTyping >= 2000) {
          c.lastTyping = now;
          c.typingUntil = now + 5000;
        }
      } catch (Exception e) {
        socket.close(CloseStatus.POLICY_VIOLATION);
      }
      return;
    }
    if (c == null) {
      socket.close(CloseStatus.POLICY_VIOLATION);
      return;
    }
    try {
      var data = json.readTree(message.getPayload());
      String token = data.path("token").asText();
      Actor actor = auth.authenticate(token).orElseThrow();
      c.user = actor.id();
      c.name = (String) db.one("SELECT name FROM app_user WHERE id=?", actor.id()).get("name");
      if ("activity".equals(data.path("scope").asText())) {
        c.activity = true;
        c.token = token;
        synchronized (c) {
          socket.sendMessage(new TextMessage("{\"type\":\"app_ready\"}"));
        }
      } else if ("rides".equals(data.path("scope").asText())) {
        c.rides = true;
        c.token = token;
        synchronized (c) {
          socket.sendMessage(new TextMessage("{\"type\":\"rides_ready\"}"));
        }
      } else {
        UUID room = UUID.fromString(data.path("roomId").asText());
        study.member(actor, room);
        c.room = room;
        c.token = token;
      }
    } catch (Exception e) {
      socket.close(CloseStatus.POLICY_VIOLATION);
    }
  }

  @Scheduled(fixedDelay = 1200)
  public void publish() {
    for (var c : connections.values()) {
      try {
        if (!c.socket.isOpen()) {
          connections.remove(c.socket.getId());
          continue;
        }
        if (c.token == null) {
          if (System.currentTimeMillis() - c.opened > 5000)
            c.socket.close(CloseStatus.POLICY_VIOLATION);
          continue;
        }
        // Global activity/ride sockets are event-driven. Authenticating every
        // one of them on the 1.2s room snapshot loop created needless database
        // traffic and slowed the whole API as connected clients increased.
        if (c.rides || c.activity) continue;
        Actor actor = auth.authenticate(c.token).orElseThrow();
        if (System.currentTimeMillis() - c.lastHeartbeat > 30000) {
          study.heartbeat(actor, c.room);
          c.lastHeartbeat = System.currentTimeMillis();
        }
        var typing = new LinkedHashMap<UUID, String>();
        for (var peer : connections.values())
          if (Objects.equals(peer.room, c.room)
              && !Objects.equals(peer.user, c.user)
              && peer.typingUntil > System.currentTimeMillis()
              && peer.user != null
              && !db.exists(
                  "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR"
                      + " (user_id=? AND blocked_id=?))",
                  c.user,
                  peer.user,
                  peer.user,
                  c.user)) typing.put(peer.user, peer.name);
        String typingPayload =
            json.writeValueAsString(
                Map.of(
                    "type",
                    "typing",
                    "users",
                    typing.entrySet().stream()
                        .map(e -> Map.of("id", e.getKey(), "name", e.getValue()))
                        .toList()));
        if (!typingPayload.equals(c.typingPrevious)) {
          synchronized (c) {
            c.socket.sendMessage(new TextMessage(typingPayload));
          }
          c.typingPrevious = typingPayload;
        }
        var detail = study.detail(actor, c.room);
        String payload =
            json.writeValueAsString(
                Map.of(
                    "type",
                    "snapshot",
                    "room",
                    detail,
                    "messages",
                    chat.messages(actor, c.room, 0)));
        if (!payload.equals(c.previous)) {
          synchronized (c) {
            c.socket.sendMessage(new TextMessage(payload));
          }
          c.previous = payload;
        }
      } catch (Exception e) {
        try {
          c.socket.close(CloseStatus.POLICY_VIOLATION);
        } catch (Exception ignored) {
        }
        connections.remove(c.socket.getId());
      }
    }
  }

  @org.springframework.transaction.event.TransactionalEventListener(
      phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT)
  public void ridesChanged(br.com.enturma.rides.RideChanged event) {
    for (var c : connections.values()) {
      if (!c.rides
          || !c.socket.isOpen()
          || (!event.publicListing() && !event.users().contains(c.user))) continue;
      try {
        if (auth.authenticate(c.token).isEmpty()) {
          c.socket.close(CloseStatus.POLICY_VIOLATION);
          continue;
        }
        synchronized (c) {
          c.socket.sendMessage(new TextMessage("{\"type\":\"rides_changed\"}"));
        }
      } catch (Exception e) {
        try {
          c.socket.close();
        } catch (Exception ignored) {
        }
        connections.remove(c.socket.getId());
      }
    }
  }

  @org.springframework.transaction.event.TransactionalEventListener(
      phase = org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT,
      fallbackExecution = true)
  public void appChanged(br.com.enturma.notifications.AppChanged event) {
    for (var c : connections.values()) {
      if (!c.activity
          || !c.socket.isOpen()
          || (!event.users().isEmpty() && !event.users().contains(c.user))) continue;
      try {
        if (auth.authenticate(c.token).isEmpty()) {
          c.socket.close(CloseStatus.POLICY_VIOLATION);
          continue;
        }
        synchronized (c) {
          c.socket.sendMessage(
              new TextMessage(json.writeValueAsString(Map.of("type", event.type()))));
        }
      } catch (Exception e) {
        try {
          c.socket.close();
        } catch (Exception ignored) {
        }
        connections.remove(c.socket.getId());
      }
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession socket, CloseStatus status) {
    connections.remove(socket.getId());
  }
}
