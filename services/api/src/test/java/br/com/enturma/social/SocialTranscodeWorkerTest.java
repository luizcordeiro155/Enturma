package br.com.enturma.social;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;

class SocialTranscodeWorkerTest {

  @Test
  void rejectsUnauthorizedRequestsBeforeProcessingUserMedia() throws Exception {
    String token = "valid-token-with-at-least-thirty-two-characters";
    var transcoder = new SocialTranscoder(new ObjectMapper(), "missing-ffmpeg", "missing-ffprobe");
    HttpServer server = SocialTranscodeWorker.createServer(0, token, transcoder);
    server.start();
    try {
      String base = "http://127.0.0.1:" + server.getAddress().getPort();
      HttpClient client = HttpClient.newHttpClient();

      var health = client.send(
          HttpRequest.newBuilder(URI.create(base + "/health")).GET().build(),
          HttpResponse.BodyHandlers.ofString());
      assertThat(health.statusCode()).isEqualTo(503);

      var unauthorizedReadiness = client.send(
          HttpRequest.newBuilder(URI.create(base + "/ready")).GET().build(),
          HttpResponse.BodyHandlers.ofString());
      assertThat(unauthorizedReadiness.statusCode()).isEqualTo(401);

      var unauthorizedMedia = client.send(
          HttpRequest.newBuilder(URI.create(base + "/render"))
              .header("Authorization", "Bearer wrong-token")
              .POST(HttpRequest.BodyPublishers.ofString("example")).build(),
          HttpResponse.BodyHandlers.ofString());
      assertThat(unauthorizedMedia.statusCode()).isEqualTo(401);

      var authorizedReadiness = client.send(
          HttpRequest.newBuilder(URI.create(base + "/ready"))
              .header("Authorization", "Bearer " + token).GET().build(),
          HttpResponse.BodyHandlers.ofString());
      assertThat(authorizedReadiness.statusCode()).isEqualTo(503);
    } finally {
      server.stop(0);
    }
  }
}
