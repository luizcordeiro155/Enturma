package br.com.enturma.rides;

import br.com.enturma.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class RideMapService {
  private final ObjectMapper json;
  private final HttpClient http;
  private final String geocoder;
  private final String router;
  private final String userAgent;

  public RideMapService(ObjectMapper json, Environment env) {
    this.json = json;
    this.http =
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    this.geocoder =
        trimBase(
            env.getProperty(
                "RIDE_GEOCODER_URL", "https://nominatim.openstreetmap.org"));
    this.router =
        trimBase(
            env.getProperty(
                "RIDE_ROUTER_URL", "https://router.project-osrm.org"));
    String appUrl = env.getProperty("APP_URL", "https://enturma-flax.vercel.app");
    this.userAgent = "Enturma/0.3 (" + appUrl + ")";
  }

  public Object search(String query, Double lat, Double lng) {
    String q = query == null ? "" : query.strip();
    if (q.length() < 3 || q.length() > 160)
      throw ApiException.invalid("Digite pelo menos 3 caracteres para pesquisar um local.");
    StringBuilder url =
        new StringBuilder(geocoder)
            .append("/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=br&q=")
            .append(enc(q));
    if (valid(lat, lng))
      url.append("&viewbox=")
          .append(lng - 0.45)
          .append(",")
          .append(lat + 0.45)
          .append(",")
          .append(lng + 0.45)
          .append(",")
          .append(lat - 0.45)
          .append("&bounded=0");
    JsonNode root = getJson(url.toString());
    var out = new ArrayList<Map<String, Object>>();
    if (root.isArray())
      for (JsonNode node : root) {
        Double y = decimal(node.path("lat").asText(null));
        Double x = decimal(node.path("lon").asText(null));
        if (!valid(y, x)) continue;
        var item = new LinkedHashMap<String, Object>();
        item.put("id", node.path("place_id").asText(UUID.randomUUID().toString()));
        item.put("label", node.path("display_name").asText("Local"));
        item.put("lat", y);
        item.put("lng", x);
        item.put("type", node.path("type").asText(""));
        out.add(item);
      }
    return out;
  }

  public Object reverse(double lat, double lng) {
    coordinate(lat, lng);
    JsonNode node =
        getJson(
            geocoder
                + "/reverse?format=jsonv2&zoom=18&addressdetails=1&lat="
                + lat
                + "&lon="
                + lng);
    return Map.of(
        "label", node.path("display_name").asText("Local selecionado"),
        "lat", lat,
        "lng", lng);
  }

  public Object route(List<Point> points) {
    if (points == null || points.size() < 2 || points.size() > 8)
      throw ApiException.invalid("A rota precisa ter entre 2 e 8 pontos.");
    StringBuilder coords = new StringBuilder();
    for (Point point : points) {
      coordinate(point.lat(), point.lng());
      if (!coords.isEmpty()) coords.append(';');
      coords.append(point.lng()).append(',').append(point.lat());
    }
    String url =
        router
            + "/route/v1/driving/"
            + coords
            + "?overview=full&geometries=geojson&steps=false&alternatives=false";
    JsonNode root = getJson(url);
    JsonNode route = root.path("routes").path(0);
    if (route.isMissingNode() || route.isNull())
      throw new ApiException(
          422, "ROUTE_UNAVAILABLE", "Não foi possível calcular uma rota entre estes pontos.");
    var geometry = new ArrayList<List<Double>>();
    for (JsonNode pair : route.path("geometry").path("coordinates"))
      if (pair.isArray() && pair.size() >= 2)
        geometry.add(List.of(pair.get(1).asDouble(), pair.get(0).asDouble()));
    var out = new LinkedHashMap<String, Object>();
    out.put("distanceMeters", Math.max(0, route.path("distance").asInt()));
    out.put("durationSeconds", Math.max(0, route.path("duration").asInt()));
    var legDurations = new ArrayList<Integer>();
    for (JsonNode leg : route.path("legs"))
      legDurations.add(Math.max(0, leg.path("duration").asInt()));
    out.put("legDurationsSeconds", legDurations);
    out.put("geometry", geometry);
    return out;
  }

  private JsonNode getJson(String url) {
    try {
      HttpRequest request =
          HttpRequest.newBuilder(URI.create(url))
              .timeout(Duration.ofSeconds(8))
              .header("Accept", "application/json")
              .header("User-Agent", userAgent)
              .GET()
              .build();
      HttpResponse<String> response =
          http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() == 429)
        throw new ApiException(
            429,
            "MAP_PROVIDER_LIMIT",
            "O serviço de mapas está ocupado. Tente novamente em alguns segundos.");
      if (response.statusCode() < 200 || response.statusCode() >= 300)
        throw new ApiException(
            502, "MAP_PROVIDER_ERROR", "O serviço de mapas não respondeu corretamente.");
      return json.readTree(response.body());
    } catch (ApiException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ApiException(
          502, "MAP_PROVIDER_ERROR", "Não foi possível consultar o serviço de mapas agora.");
    }
  }

  public record Point(double lat, double lng) {}

  private static void coordinate(double lat, double lng) {
    if (!valid(lat, lng)) throw ApiException.invalid("A coordenada informada é inválida.");
  }

  private static boolean valid(Double lat, Double lng) {
    return lat != null
        && lng != null
        && lat >= -90
        && lat <= 90
        && lng >= -180
        && lng <= 180;
  }

  private static Double decimal(String value) {
    if (value == null) return null;
    try {
      return Double.valueOf(value);
    } catch (NumberFormatException ignored) {
      return null;
    }
  }

  private static String enc(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private static String trimBase(String value) {
    String clean = value == null ? "" : value.strip();
    while (clean.endsWith("/")) clean = clean.substring(0, clean.length() - 1);
    return clean;
  }
}
