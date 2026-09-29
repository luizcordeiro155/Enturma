package br.com.enturma.voice;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class LiveKitProvider implements VoiceProvider {
  private final Environment env;
  private final ObjectMapper json;
  private final HttpClient client;

  public LiveKitProvider(Environment env, ObjectMapper json) {
    this.env = env;
    this.json = json;
    this.client =
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
  }

  public boolean enabled() {
    return env.getProperty("VOICE_ENABLED", Boolean.class, false)
        && !env.getProperty("LIVEKIT_API_KEY", "").isBlank()
        && !env.getProperty("LIVEKIT_API_SECRET", "").isBlank()
        && !url().isBlank();
  }

  public String url() {
    return env.getProperty("LIVEKIT_URL", "");
  }

  private String sign(Map<String, Object> claims) {
    try {
      Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
      String header =
          b64.encodeToString(
              "{\\\"alg\\\":\\\"HS256\\\",\\\"typ\\\":\\\"JWT\\\"}".getBytes(StandardCharsets.UTF_8));
      String payload = header + "." + b64.encodeToString(json.writeValueAsBytes(claims));
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(
          new SecretKeySpec(
              env.getRequiredProperty("LIVEKIT_API_SECRET").getBytes(StandardCharsets.UTF_8),
              "HmacSHA256"));
      return payload
          + "."
          + b64.encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException("Falha ao assinar autorização de mídia", e);
    }
  }

  public String token(String identity, String name, String room, long expires) {
    if (!enabled())
      throw new ApiException(503, "VOICE_UNAVAILABLE", "As chamadas ainda não estão disponíveis.");
    return sign(
        Map.of(
            "iss",
            env.getRequiredProperty("LIVEKIT_API_KEY"),
            "sub",
            identity,
            "name",
            name,
            "nbf",
            Instant.now().getEpochSecond() - 5,
            "exp",
            expires,
            "video",
            Map.of(
                "room",
                room,
                "roomJoin",
                true,
                "canPublish",
                true,
                "canSubscribe",
                true,
                "canPublishData",
                false,
                "canPublishSources",
                List.of("microphone", "camera", "screen_share", "screen_share_audio"))));
  }

  private com.fasterxml.jackson.databind.JsonNode call(
      String method, String room, Map<String, String> body) {
    try {
      String jwt =
          sign(
              Map.of(
                  "iss",
                  env.getRequiredProperty("LIVEKIT_API_KEY"),
                  "exp",
                  Instant.now().plusSeconds(60).getEpochSecond(),
                  "video",
                  Map.of("room", room, "roomCreate", true, "roomAdmin", true, "roomList", true)));
      String host = url().replaceFirst("^wss:", "https:").replaceFirst("^ws:", "http:");
      var req =
          HttpRequest.newBuilder(URI.create(host + "/twirp/livekit.RoomService/" + method))
              .timeout(Duration.ofSeconds(8))
              .header("Authorization", "Bearer " + jwt)
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
              .build();
      var response = client.send(req, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() == 404) return json.createObjectNode();
      if (response.statusCode() != 200) throw new IllegalStateException("Mídia indisponível");
      return json.readTree(response.body());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException(e);
    } catch (Exception e) {
      throw new IllegalStateException("Falha na operação de mídia", e);
    }
  }

  public void deleteRoom(String room) {
    call("DeleteRoom", room, Map.of("room", room));
  }

  public void remove(String room, String identity) {
    call("RemoveParticipant", room, Map.of("room", room, "identity", identity));
  }

  public List<String> participants(String room) {
    List<String> ids = new ArrayList<>();
    call("ListParticipants", room, Map.of("room", room))
        .path("participants")
        .forEach(p -> ids.add(p.path("identity").asText()));
    return ids;
  }
}
