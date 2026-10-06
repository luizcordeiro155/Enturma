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
    if (q.length() < 2 || q.length() > 160)
      throw ApiException.invalid("Digite pelo menos 2 caracteres para pesquisar um local.");

    var unique = new LinkedHashMap<String, Map<String, Object>>();
    ApiException primaryFailure = null;
    boolean providerAnswered = false;

    try {
      JsonNode direct = getJson(candidateUrl(q, null, lat, lng, 14));
      appendCandidates(direct, unique, q, lat, lng);
      providerAnswered = true;
    } catch (ApiException failure) {
      primaryFailure = failure;
    }

    // ArcGIS Suggest is stronger for establishments and partially typed business names.
    // Resolve only a few top suggestions to keep requests bounded.
    try {
      StringBuilder suggestUrl =
          new StringBuilder(addressGeocoder)
              .append("/suggest?f=json&countryCode=BRA&maxSuggestions=8&text=")
              .append(enc(q));
      if (valid(lat, lng))
        suggestUrl.append("&location=").append(lng).append(",").append(lat);

      JsonNode suggestions = getJson(suggestUrl.toString());
      int resolved = 0;
      for (JsonNode suggestion : suggestions.path("suggestions")) {
        if (resolved >= 4) break;
        String text = suggestion.path("text").asText("").strip();
        String magicKey = suggestion.path("magicKey").asText("").strip();
        if (text.isBlank() || magicKey.isBlank()) continue;
        try {
          JsonNode exact =
              getJson(candidateUrl(text, magicKey, lat, lng, 2));
          appendCandidates(exact, unique, q, lat, lng);
          resolved++;
          providerAnswered = true;
        } catch (ApiException ignored) {
          // A single stale suggestion must never break the entire search.
        }
      }
    } catch (ApiException ignored) {
      // Direct candidates remain usable if autocomplete is temporarily unavailable.
    }

    if (!providerAnswered && primaryFailure != null) throw primaryFailure;

    var out = new ArrayList<>(unique.values());
    out.sort(
        Comparator
            .<Map<String, Object>>comparingDouble(item -> -searchRank(item, q))
            .thenComparingInt(
                item ->
                    item.get("distanceMeters") instanceof Number number
                        ? number.intValue()
                        : Integer.MAX_VALUE));

    return out.stream().limit(10).toList();
  }

  private String candidateUrl(
      String text, String magicKey, Double lat, Double lng, int maxLocations) {
    StringBuilder url =
        new StringBuilder(addressGeocoder)
            .append("/findAddressCandidates?f=json")
            .append("&SingleLine=")
            .append(enc(text))
            .append("&countryCode=BRA&maxLocations=")
            .append(maxLocations)
            .append(
                "&outFields=Match_addr,LongLabel,ShortLabel,Addr_type,Type,PlaceName,Place_addr,StAddr,City,Region,Postal,Distance");
    if (magicKey != null && !magicKey.isBlank())
      url.append("&magicKey=").append(enc(magicKey));
    if (valid(lat, lng))
      url.append("&location=").append(lng).append(",").append(lat);
    return url.toString();
  }

  private void appendCandidates(
      JsonNode root,
      Map<String, Map<String, Object>> unique,
      String query,
      Double lat,
      Double lng) {
    for (JsonNode candidate : root.path("candidates")) {
      JsonNode location = candidate.path("location");
      Double y = location.has("y") ? location.path("y").asDouble() : null;
      Double x = location.has("x") ? location.path("x").asDouble() : null;
      if (!valid(y, x)) continue;

      int score = candidate.path("score").asInt(0);
      if (score < 68) continue;

      JsonNode attributes = candidate.path("attributes");
      String addrType = attributes.path("Addr_type").asText("");
      String category = attributes.path("Type").asText("");
      String placeName = attributes.path("PlaceName").asText("");
      String shortLabel = attributes.path("ShortLabel").asText("");
      String matchAddress =
          attributes.path("Match_addr").asText(candidate.path("address").asText("Local"));
      String placeAddress = attributes.path("Place_addr").asText("");
      String longLabel = attributes.path("LongLabel").asText("");

      boolean poi = "POI".equalsIgnoreCase(addrType);
      String label =
          !placeName.isBlank()
              ? placeName
              : (!shortLabel.isBlank() ? shortLabel : matchAddress);
      String address =
          !placeAddress.isBlank()
              ? placeAddress
              : (!longLabel.isBlank() ? longLabel : matchAddress);

      var item = new LinkedHashMap<String, Object>();
      item.put(
          "id",
          "arcgis-" + Integer.toHexString(Objects.hash(label, address, y, x)));
      item.put("label", label);
      item.put("address", address);
      item.put("lat", y);
      item.put("lng", x);
      item.put("type", addrType);
      item.put("category", category);
      item.put("poi", poi);
      item.put("score", score);

      if (valid(lat, lng)) {
        int distanceMeters =
            attributes.has("Distance")
                ? Math.max(0, (int) Math.round(attributes.path("Distance").asDouble()))
                : (int) Math.round(haversineMeters(lat, lng, y, x));
        item.put("distanceMeters", distanceMeters);
      }

      String key =
          normalizeSearch(label)
              + "|"
              + normalizeSearch(address)
              + "|"
              + String.format(Locale.ROOT, "%.5f,%.5f", y, x);
      unique.putIfAbsent(key, item);
    }
  }

  private static double searchRank(Map<String, Object> item, String query) {
    String label = String.valueOf(item.getOrDefault("label", ""));
    String address = String.valueOf(item.getOrDefault("address", ""));
    String category = String.valueOf(item.getOrDefault("category", ""));
    String searchable = normalizeSearch(label + " " + address + " " + category);
    String compactSearchable = searchable.replace(" ", "");
    String normalizedQuery = normalizeSearch(query);
    String compactQuery = normalizedQuery.replace(" ", "");

    var tokens =
        Arrays.stream(normalizedQuery.split("\\s+"))
            .filter(token -> token.length() >= 2)
            .distinct()
            .toList();

    double matched =
        tokens.isEmpty()
            ? 0
            : tokens.stream().filter(searchable::contains).count() / (double) tokens.size();
    double compactBonus =
        !compactQuery.isBlank() && compactSearchable.contains(compactQuery) ? 1.3 : 0;
    double poiBonus = Boolean.TRUE.equals(item.get("poi")) ? 0.8 : 0;
    double providerScore =
        item.get("score") instanceof Number number ? number.doubleValue() / 100d : 0;

    double distancePenalty = 0;
    if (item.get("distanceMeters") instanceof Number number) {
      distancePenalty = Math.min(0.65, number.doubleValue() / 30_000d);
    }

    return matched * 4.0 + compactBonus + poiBonus + providerScore - distancePenalty;
  }

  private static String normalizeSearch(String value) {
    if (value == null) return "";
    String normalized =
        java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", " ")
            .trim();
    return normalized.replaceAll("\\s+", " ");
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

    try {
      JsonNode root =
          getJson(
              addressGeocoder
                  + "/reverseGeocode?f=json&langCode=pt-BR&location="
                  + lng
                  + ","
                  + lat);
      JsonNode address = root.path("address");
      if (address.isObject() && !address.isEmpty()) {
        return arcGisReverseResult(address, lat, lng);
      }
    } catch (ApiException ignored) {
      // Fall back to Nominatim so current-location lookup still works.
    }

    JsonNode node =
        getJson(
            geocoder
                + "/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=pt-BR&lat="
                + lat
                + "&lon="
                + lng);
    return nominatimReverseResult(node, lat, lng);
  }

  private static Map<String, Object> arcGisReverseResult(
      JsonNode address, double lat, double lng) {
    String addressType = address.path("Addr_type").asText("").strip();
    String category = address.path("Type").asText("").strip();
    String placeName = address.path("PlaceName").asText("").strip();
    String shortLabel = address.path("ShortLabel").asText("").strip();
    String matchAddress = address.path("Match_addr").asText("").strip();
    String longLabel = address.path("LongLabel").asText("").strip();
    String streetLine = address.path("Address").asText("").strip();
    String houseNumber = address.path("AddNum").asText("").strip();

    if (!houseNumber.isBlank()
        && !normalizeHouseNumber(streetLine).contains(normalizeHouseNumber(houseNumber))) {
      streetLine = streetLine.isBlank() ? houseNumber : streetLine + ", " + houseNumber;
    }

    String city = firstText(address, "City", "District", "Neighborhood");
    String region = firstText(address, "RegionAbbr", "Region");
    String formattedAddress = joinAddressParts(streetLine, city, region);
    if (formattedAddress.isBlank()) {
      formattedAddress = !matchAddress.isBlank() ? matchAddress : longLabel;
    }

    boolean poi = "POI".equalsIgnoreCase(addressType);
    String label =
        poi && !placeName.isBlank()
            ? placeName
            : (!shortLabel.isBlank()
                ? shortLabel
                : (!matchAddress.isBlank() ? matchAddress : formattedAddress));
    if (label == null || label.isBlank()) label = "Local selecionado";

    var out = new LinkedHashMap<String, Object>();
    out.put("label", label);
    if (formattedAddress != null && !formattedAddress.isBlank()) {
      out.put("address", formattedAddress);
    }
    out.put("lat", lat);
    out.put("lng", lng);
    out.put("type", addressType);
    if (!category.isBlank()) out.put("category", category);
    out.put("poi", poi);
    if (!houseNumber.isBlank()) out.put("houseNumber", houseNumber);
    return out;
  }

  private static Map<String, Object> nominatimReverseResult(
      JsonNode node, double lat, double lng) {
    JsonNode address = node.path("address");
    String houseNumber = firstText(address, "house_number");
    String road = firstText(address, "road", "pedestrian", "residential", "street", "path");
    String city =
        firstText(address, "city", "town", "municipality", "village", "city_district");
    String state = firstText(address, "state");

    String streetLine =
        road == null
            ? (houseNumber == null ? "" : houseNumber)
            : (houseNumber == null || houseNumber.isBlank()
                ? road
                : road + ", " + houseNumber);
    String formattedAddress = joinAddressParts(streetLine, city, state);
    if (formattedAddress.isBlank()) {
      formattedAddress = node.path("display_name").asText("Local selecionado");
    }

    String category = node.path("category").asText("").strip();
    String type = node.path("type").asText("").strip();
    String name = node.path("name").asText("").strip();
    boolean poi =
        !name.isBlank()
            && Set.of("amenity", "shop", "tourism", "leisure", "office", "healthcare", "craft")
                .contains(category.toLowerCase(Locale.ROOT));

    var out = new LinkedHashMap<String, Object>();
    out.put("label", poi ? name : (!streetLine.isBlank() ? streetLine : formattedAddress));
    out.put("address", formattedAddress);
    out.put("lat", lat);
    out.put("lng", lng);
    out.put("type", type);
    if (!category.isBlank()) out.put("category", category);
    out.put("poi", poi);
    if (houseNumber != null && !houseNumber.isBlank()) out.put("houseNumber", houseNumber);
    return out;
  }

  private static String joinAddressParts(String... parts) {
    var joiner = new StringJoiner(", ");
    var seen = new LinkedHashSet<String>();
    for (String part : parts) {
      if (part == null) continue;
      String clean = part.strip();
      if (clean.isBlank()) continue;
      String key = normalizeSearch(clean);
      if (seen.add(key)) joiner.add(clean);
    }
    return joiner.toString();
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

  private static double haversineMeters(
      double lat1, double lng1, double lat2, double lng2) {
    double earth = 6_371_000d;
    double p1 = Math.toRadians(lat1);
    double p2 = Math.toRadians(lat2);
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(p1)
                * Math.cos(p2)
                * Math.sin(dLng / 2)
                * Math.sin(dLng / 2);
    return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
