package br.com.enturma.auth;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.junit.jupiter.api.*;

/** The provider conversations against a stand-in server: what is sent, and what is believed. */
class HttpIdentityGatewayTest {
  HttpServer server;
  String base;
  final Map<String, String> asked = new HashMap<>();
  final Map<String, String> answers = new HashMap<>();
  final Map<String, Integer> statuses = new HashMap<>();

  @BeforeEach
  void start() throws Exception {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/",
        exchange -> {
          String path = exchange.getRequestURI().toString();
          asked.put(path, new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
          asked.put(
              path + " authorization",
              Objects.toString(exchange.getRequestHeaders().getFirst("Authorization"), ""));
          byte[] body = answers.getOrDefault(path, "{}").getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().add("Content-Type", "application/json");
          exchange.sendResponseHeaders(statuses.getOrDefault(path, 200), body.length);
          exchange.getResponseBody().write(body);
          exchange.close();
        });
    server.start();
    base = "http://127.0.0.1:" + server.getAddress().getPort();
  }

  @AfterEach
  void stop() {
    server.stop(0);
  }

  private HttpIdentityGateway gateway(String googleId, String githubId) {
    return new HttpIdentityGateway(
        "https://enturma.example/",
        googleId,
        googleId.isBlank() ? "" : "google-secret",
        githubId,
        githubId.isBlank() ? "" : "github-secret",
        new ObjectMapper(),
        new HttpIdentityGateway.Endpoints(base + "/google/token", base + "/github/token", base));
  }

  private static String idToken(String claims) {
    var encoder = Base64.getUrlEncoder().withoutPadding();
    return "{\"id_token\":\""
        + encoder.encodeToString("{\"alg\":\"RS256\"}".getBytes(StandardCharsets.UTF_8))
        + "."
        + encoder.encodeToString(claims.getBytes(StandardCharsets.UTF_8))
        + ".signature\"}";
  }

  private static String claims(String audience, long expires) {
    return "{\"iss\":\"https://accounts.google.com\",\"aud\":\""
        + audience
        + "\",\"exp\":"
        + expires
        + ",\"sub\":\"1077\",\"email\":\"Ana@Example.test\",\"email_verified\":true,"
        + "\"name\":\"Ana Souza\"}";
  }

  private static long soon() {
    return System.currentTimeMillis() / 1000 + 600;
  }

  @Test
  void aProviderWithoutCredentialsIsOff() {
    var gateway = gateway("", "gh-id");
    assertThat(gateway.enabled("GOOGLE")).isFalse();
    assertThat(gateway.enabled("GITHUB")).isTrue();
    assertThat(gateway.enabled("OTHER")).isFalse();
    assertThat(gateway.clientId("GOOGLE")).isEmpty();
    assertThatThrownBy(() -> gateway.exchange("GOOGLE", "code", null))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("PROVIDER_UNAVAILABLE"));
    assertThat(gateway.redirectUri("GOOGLE"))
        .isEqualTo("https://enturma.example/api/oauth/google/callback");
  }

  @Test
  void googleCodeBecomesTheVerifiedProfile() {
    answers.put("/google/token", idToken(claims("g-id", soon())));
    var profile = gateway("g-id", "").exchange("GOOGLE", "the code", "the-verifier");
    assertThat(profile.subject()).isEqualTo("1077");
    assertThat(profile.email()).isEqualTo("Ana@Example.test");
    assertThat(profile.emailVerified()).isTrue();
    assertThat(profile.name()).isEqualTo("Ana Souza");
    assertThat(asked.get("/google/token"))
        .contains("client_id=g-id")
        .contains("client_secret=google-secret")
        .contains("code=the+code")
        .contains("code_verifier=the-verifier")
        .contains("grant_type=authorization_code")
        .contains("redirect_uri=https%3A%2F%2Fenturma.example%2Fapi%2Foauth%2Fgoogle%2Fcallback");
  }

  private ExternalIdentityGateway.Profile exchangeGoogle(String claims) {
    answers.put("/google/token", idToken(claims));
    return gateway("g-id", "").exchange("GOOGLE", "code", null);
  }

  @Test
  void aTokenMeantForAnotherAppOrExpiredIsNotBelieved() {
    assertThatThrownBy(() -> exchangeGoogle(claims("someone-else", soon())))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("PROVIDER_FAILED"));
    assertThatThrownBy(() -> exchangeGoogle(claims("g-id", 1000)))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(
            () ->
                exchangeGoogle(
                    claims("g-id", soon()).replace("https://accounts.google.com", "https://evil")))
        .isInstanceOf(ApiException.class);
    // an address Google has not confirmed arrives marked as such
    assertThat(
            exchangeGoogle(
                    claims("g-id", soon())
                        .replace("\"email_verified\":true", "\"email_verified\":false"))
                .emailVerified())
        .isFalse();
  }

  @Test
  void aUsedOrExpiredCodeAsksThePersonToTryAgain() {
    statuses.put("/google/token", 400);
    answers.put("/google/token", "{\"error\":\"invalid_grant\"}");
    assertThatThrownBy(() -> gateway("g-id", "").exchange("GOOGLE", "old", null))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("OAUTH_CODE_INVALID"));
    // GitHub says the same with a 200
    answers.put("/github/token", "{\"error\":\"bad_verification_code\"}");
    assertThatThrownBy(() -> gateway("", "gh-id").exchange("GITHUB", "old", null))
        .isInstanceOfSatisfying(
            ApiException.class, e -> assertThat(e.code).isEqualTo("OAUTH_CODE_INVALID"));
  }

  @Test
  void githubCodeBecomesTheAccountAndItsPublicRepositories() {
    answers.put("/github/token", "{\"access_token\":\"gho_x\",\"token_type\":\"bearer\"}");
    answers.put("/user", "{\"id\":4242,\"login\":\"ana-dev\",\"name\":null}");
    var gateway = gateway("", "gh-id");
    var profile = gateway.exchange("GITHUB", "code", "gh-verifier");
    // the code only works together with the verifier the browser kept
    assertThat(asked.get("/github/token")).contains("code_verifier=gh-verifier");
    assertThat(profile.subject()).isEqualTo("4242");
    assertThat(profile.login()).isEqualTo("ana-dev");
    assertThat(asked.get("/user authorization")).isEqualTo("Bearer gho_x");

    String list = "/users/ana-dev/repos?type=owner&sort=pushed&per_page=30";
    answers.put(
        list,
        "[{\"full_name\":\"ana-dev/site\",\"name\":\"site\",\"description\":null,"
            + "\"homepage\":\"https://ana.example\",\"language\":\"TypeScript\","
            + "\"topics\":[\"react\"],\"stargazers_count\":7,\"fork\":false,\"archived\":true,"
            + "\"pushed_at\":\"2026-11-20T10:00:00Z\"}]");
    var repositories = gateway.repositories("ana-dev");
    assertThat(repositories).hasSize(1);
    var repository = repositories.getFirst();
    assertThat(repository.fullName()).isEqualTo("ana-dev/site");
    assertThat(repository.description()).isEmpty();
    assertThat(repository.topics()).containsExactly("react");
    assertThat(repository.stars()).isEqualTo(7);
    assertThat(repository.archived()).isTrue();
    // the app names itself, without any student's token
    assertThat(asked.get(list + " authorization")).startsWith("Basic ");
  }
}
