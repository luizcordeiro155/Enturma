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
  private final String addressGeocoder;
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
    this.addressGeocoder =
        trimBase(
            env.getProperty(
                "RIDE_ADDRESS_GEOCODER_URL",
                "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"));
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

  public Object addressSearch(
      String street, String number, Double lat, Double lng) {
    String road = street == null ? "" : street.strip();
    String house = number == null ? "" : number.strip();
    if (road.length() < 3 || road.length() > 120)
      throw ApiException.invalid("Informe o nome da rua com pelo menos 3 caracteres.");
    if (house.isBlank() || house.length() > 24)
      throw ApiException.invalid("Informe o número do endereço.");

    String singleLine = road + " " + house + ", Brasil";
    StringBuilder url =
        new StringBuilder(addressGeocoder)
            .append("/findAddressCandidates?f=json")
            .append("&SingleLine=")
            .append(enc(singleLine))
            .append("&countryCode=BRA&maxLocations=8")
            .append("&outFields=Match_addr,Addr_type,StAddr,City,Region,Postal");

    if (valid(lat, lng)) {
      url.append("&location=").append(lng).append(",").append(lat);
    }

    JsonNode root = getJson(url.toString());
    var exact = new ArrayList<Map<String, Object>>();
    var approximate = new ArrayList<Map<String, Object>>();
    String wanted = normalizeHouseNumber(house);

    for (JsonNode candidate : root.path("candidates")) {
      JsonNode location = candidate.path("location");
      Double y = location.has("y") ? location.path("y").asDouble() : null;
      Double x = location.has("x") ? location.path("x").asDouble() : null;
      if (!valid(y, x)) continue;

      int score = candidate.path("score").asInt(0);
      JsonNode attributes = candidate.path("attributes");
      String address = candidate.path("address").asText("Local");
      String streetAddress = attributes.path("StAddr").asText("");
      String addressType = attributes.path("Addr_type").asText("");

      String combined = normalizeHouseNumber(streetAddress + " " + address);
      boolean numberMatch = !wanted.isBlank() && combined.contains(wanted);
      boolean housePrecision =
          numberMatch
              && score >= 90
              && ("PointAddress".equalsIgnoreCase(addressType)
                  || "Subaddress".equalsIgnoreCase(addressType)
                  || "StreetAddress".equalsIgnoreCase(addressType));

      var item = new LinkedHashMap<String, Object>();
      item.put(
          "id",
          "arcgis-"
              + Integer.toHexString(
                  Objects.hash(address, y, x, score)));
      item.put("label", address);
      item.put("lat", y);
      item.put("lng", x);
      item.put("type", addressType);
      item.put("score", score);
      item.put("precision", housePrecision ? "HOUSE" : "STREET");
      item.put("requestedNumber", house);
      if (!streetAddress.isBlank()) item.put("streetAddress", streetAddress);
      String postal = attributes.path("Postal").asText("");
      if (!postal.isBlank()) item.put("postalCode", postal);

      if (housePrecision) exact.add(item);
      else if (score >= 75) approximate.add(item);
    }

    if (!exact.isEmpty()) return exact.stream().limit(6).toList();
    return approximate.stream().limit(4).toList();
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

  private static Map<String, Object> mapResult(JsonNode node, double lat, double lng) {
    var item = new LinkedHashMap<String, Object>();
    item.put("id", node.path("place_id").asText(UUID.randomUUID().toString()));
    item.put("label", node.path("display_name").asText("Local"));
    item.put("lat", lat);
    item.put("lng", lng);
    item.put("type", node.path("type").asText(""));
    JsonNode address = node.path("address");
    String houseNumber = address.path("house_number").asText("");
    if (!houseNumber.isBlank()) item.put("houseNumber", houseNumber);
    return item;
  }

  private static String firstText(JsonNode node, String... keys) {
    for (String key : keys) {
      String value = node.path(key).asText("");
      if (!value.isBlank()) return value;
    }
    return null;
  }

  private static void addViewbox(StringBuilder url, Double lat, Double lng) {
    if (!valid(lat, lng)) return;
    url.append("&viewbox=")
        .append(lng - 0.35)
        .append(",")
        .append(lat + 0.35)
        .append(",")
        .append(lng + 0.35)
        .append(",")
        .append(lat - 0.35)
        .append("&bounded=0");
  }

  private static String normalizeHouseNumber(String value) {
    return value == null
        ? ""
        : value.toUpperCase(Locale.ROOT).replaceAll("[^0-9A-Z]", "");
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
