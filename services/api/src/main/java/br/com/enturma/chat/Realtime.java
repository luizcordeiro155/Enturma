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
  private final AuthService auth;
  private final ChatService chat;
  private final StudyService study;
  private final ObjectMapper json;
  private final String[] origins;
  private final Map<String, Connection> connections = new ConcurrentHashMap<>();

  private static class Connection {
    final WebSocketSession socket;
    final long opened = System.currentTimeMillis();
    String token;
    UUID room;
    String previous = "";

    Connection(WebSocketSession socket) {
      this.socket = socket;
    }
  }

  public Realtime(
      AuthService auth,
      ChatService chat,
      StudyService study,
      ObjectMapper json,
      @Value("${enturma.origins}") String origins) {
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
    if (connections.size() >= 1000) {
      socket.close(CloseStatus.SERVICE_OVERLOAD);
      return;
    }
    socket.setTextMessageSizeLimit(1024);
    connections.put(socket.getId(), new Connection(socket));
  }

  @Override
  protected void handleTextMessage(WebSocketSession socket, TextMessage message) throws Exception {
    var c = connections.get(socket.getId());
    if (c == null || c.token != null) {
      socket.close(CloseStatus.POLICY_VIOLATION);
      return;
    }
    try {
      var data = json.readTree(message.getPayload());
      String token = data.path("token").asText();
      UUID room = UUID.fromString(data.path("roomId").asText());
      Actor actor = auth.authenticate(token).orElseThrow();
      study.member(actor, room);
      c.room = room;
      c.token = token;
    } catch (Exception e) {
      socket.close(CloseStatus.POLICY_VIOLATION);
    }
  }

  @Scheduled(fixedDelay = 1500)
  public void publish() {
    for (var c : connections.values())
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
        Actor actor = auth.authenticate(c.token).orElseThrow();
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

  @Override
  public void afterConnectionClosed(WebSocketSession socket, CloseStatus status) {
    connections.remove(socket.getId());
  }
}
