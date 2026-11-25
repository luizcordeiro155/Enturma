package br.com.enturma.auth;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class HttpIdentityGateway implements ExternalIdentityGateway {
  private record Client(String id, String secret) {
    boolean ready() {
      return !id.isBlank() && !secret.isBlank();
    }
  }

  /** Where each provider answers. Only tests point these anywhere else. */
  record Endpoints(String googleToken, String githubToken, String githubApi) {
    static final Endpoints REAL =
        new Endpoints(
            "https://oauth2.googleapis.com/token",
            "https://github.com/login/oauth/access_token",
            "https://api.github.com");
  }

  private final Map<String, Client> clients;
  private final Endpoints endpoints;
  private final String appUrl;
  private final ObjectMapper json;
  private final HttpClient http =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  @org.springframework.beans.factory.annotation.Autowired
  public HttpIdentityGateway(
      @Value("${enturma.app-url}") String appUrl,
      @Value("${enturma.oauth.google.client-id:}") String googleId,
      @Value("${enturma.oauth.google.client-secret:}") String googleSecret,
      @Value("${enturma.oauth.github.client-id:}") String githubId,
      @Value("${enturma.oauth.github.client-secret:}") String githubSecret,
      ObjectMapper json) {
    this(appUrl, googleId, googleSecret, githubId, githubSecret, json, Endpoints.REAL);
  }

  HttpIdentityGateway(
      String appUrl,
      String googleId,
      String googleSecret,
      String githubId,
      String githubSecret,
      ObjectMapper json,
      Endpoints endpoints) {
    this.endpoints = endpoints;
    this.appUrl = appUrl.strip().replaceFirst("/+$", "");
    this.json = json;
    clients =
        Map.of(
            "GOOGLE", new Client(googleId.strip(), googleSecret.strip()),
            "GITHUB", new Client(githubId.strip(), githubSecret.strip()));
  }

  @Override
  public boolean enabled(String provider) {
    Client client = clients.get(provider);
    return client != null && client.ready();
  }

  @Override
  public String clientId(String provider) {
    return enabled(provider) ? clients.get(provider).id() : "";
  }

  @Override
  public String redirectUri(String provider) {
    return appUrl + "/api/oauth/" + provider.toLowerCase(Locale.ROOT) + "/callback";
  }

  @Override
  public Profile exchange(String provider, String code, String codeVerifier) {
    if (!enabled(provider)) throw unavailable();
    Client client = clients.get(provider);
    var form = new LinkedHashMap<String, String>();
    form.put("client_id", client.id());
    form.put("client_secret", client.secret());
    form.put("code", code);
    form.put("redirect_uri", redirectUri(provider));
    if (codeVerifier != null && !codeVerifier.isBlank()) form.put("code_verifier", codeVerifier);
    if (provider.equals("GOOGLE")) {
      form.put("grant_type", "authorization_code");
      return google(post(endpoints.googleToken(), form), client);
    }
    JsonNode token = post(endpoints.githubToken(), form);
    String access = token.path("access_token").asText("");
    if (access.isBlank()) throw expired();
    // The token is used for this one question and dropped.
    JsonNode user =
        get(
            HttpRequest.newBuilder(URI.create(endpoints.githubApi() + "/user"))
                .header("Authorization", "Bearer " + access));
    String id = user.path("id").asText("");
    String login = user.path("login").asText("");
    if (id.isBlank() || login.isBlank()) throw failed();
    return new Profile(id, login, null, false, user.path("name").asText(login));
  }

  /** Google answers with an ID token; it came straight from Google over TLS, so its claims hold. */
  private Profile google(JsonNode token, Client client) {
    String[] parts = token.path("id_token").asText("").split("\\.");
    if (parts.length != 3) throw expired();
    JsonNode claims;
    try {
      claims = json.readTree(Base64.getUrlDecoder().decode(parts[1]));
    } catch (Exception e) {
      throw failed();
    }
    String issuer = claims.path("iss").asText("");
    if (!(issuer.equals("https://accounts.google.com") || issuer.equals("accounts.google.com"))
        || !claims.path("aud").asText("").equals(client.id())
        || claims.path("exp").asLong(0) < System.currentTimeMillis() / 1000
        || claims.path("sub").asText("").isBlank()) throw failed();
    String email = claims.path("email").asText("");
    return new Profile(
        claims.path("sub").asText(),
        email,
        email,
        claims.path("email_verified").asBoolean(false)
            || claims.path("email_verified").asText("").equals("true"),
        claims.path("name").asText(""));
  }

  @Override
  public List<Repository> repositories(String login) {
    var request =
        HttpRequest.newBuilder(
            URI.create(
                endpoints.githubApi()
                    + "/users/"
                    + URLEncoder.encode(login, StandardCharsets.UTF_8)
                    + "/repos?type=owner&sort=pushed&per_page=30"));
    // Public data only; naming the app gives it its own request budget at GitHub.
    if (enabled("GITHUB")) {
      Client client = clients.get("GITHUB");
      request.header(
          "Authorization",
          "Basic "
              + Base64.getEncoder()
                  .encodeToString(
                      (client.id() + ":" + client.secret()).getBytes(StandardCharsets.UTF_8)));
    }
    var out = new ArrayList<Repository>();
    for (JsonNode row : get(request)) {
      var topics = new ArrayList<String>();
      for (JsonNode topic : row.path("topics")) topics.add(topic.asText());
      out.add(
          new Repository(
              row.path("full_name").asText(""),
              row.path("name").asText(""),
              row.path("description").asText(""),
              row.path("homepage").asText(""),
              row.path("language").asText(""),
              topics,
              row.path("stargazers_count").asInt(0),
              row.path("fork").asBoolean(false),
              row.path("archived").asBoolean(false),
              row.path("pushed_at").asText("")));
    }
    return out;
  }

  private JsonNode post(String url, Map<String, String> form) {
    var body = new StringJoiner("&");
    form.forEach(
        (key, value) ->
            body.add(
                URLEncoder.encode(key, StandardCharsets.UTF_8)
                    + "="
                    + URLEncoder.encode(value, StandardCharsets.UTF_8)));
    return send(
        HttpRequest.newBuilder(URI.create(url))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body.toString())),
        true);
  }

  private JsonNode get(HttpRequest.Builder request) {
    return send(request.header("X-GitHub-Api-Version", "2022-11-28").GET(), false);
  }

  private JsonNode send(HttpRequest.Builder request, boolean exchange) {
    try {
      var response =
          http.send(
              request
                  .header("Accept", "application/json")
                  .header("User-Agent", "Enturma")
                  .timeout(Duration.ofSeconds(8))
                  .build(),
              HttpResponse.BodyHandlers.ofString());
      // A code that was already used or expired is the person's to retry, not an outage.
      if (exchange && response.statusCode() >= 400 && response.statusCode() < 500) throw expired();
      if (response.statusCode() / 100 != 2) throw failed();
      JsonNode body = json.readTree(response.body());
      if (exchange && body.hasNonNull("error")) throw expired();
      return body;
    } catch (ApiException e) {
      throw e;
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw failed();
    } catch (Exception e) {
      throw failed();
    }
  }

  private static ApiException unavailable() {
    return new ApiException(
        503, "PROVIDER_UNAVAILABLE", "Essa forma de entrar não está disponível agora.");
  }

  private static ApiException expired() {
    return new ApiException(
        400, "OAUTH_CODE_INVALID", "Esse acesso expirou. Tente de novo.");
  }

  private static ApiException failed() {
    return new ApiException(
        502, "PROVIDER_FAILED", "Não foi possível confirmar sua conta agora. Tente de novo.");
  }
}
