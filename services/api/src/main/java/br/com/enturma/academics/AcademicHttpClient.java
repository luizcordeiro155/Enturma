package br.com.enturma.academics;

import br.com.enturma.common.ApiException;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.stereotype.Component;

/**
 * Restricted to known institutional domains; redirects and every resolved address are revalidated.
 */
@Component
public class AcademicHttpClient {
  private static final List<String> DOMAINS =
      List.of(
          "una.br",
          "unibh.br",
          "pucminas.br",
          "ufmg.br",
          "cefetmg.br",
          "ufop.br",
          "fumec.br",
          "mec.gov.br",
          "inep.gov.br",
          "dados.gov.br",
          "estaticos.animaeducacao.com.br");
  private HttpClient client;
  private final Map<String, Long> lastRequest = new HashMap<>();

  public record Download(byte[] bytes, String mime, String finalUrl) {}

  public static URI validate(String url) {
    try {
      URI uri = URI.create(url);
      String host = uri.getHost();
      if (!"https".equals(uri.getScheme())
          || host == null
          || uri.getUserInfo() != null
          || (uri.getPort() != -1 && uri.getPort() != 443)
          || uri.getFragment() != null
          || DOMAINS.stream().noneMatch(d -> host.equals(d) || host.endsWith("." + d)))
        throw new IllegalArgumentException();
      return uri;
    } catch (Exception e) {
      throw new ApiException(
          400,
          "ACADEMIC_SOURCE_NOT_VERIFIED",
          "A coleta aceita somente os domínios institucionais cadastrados.");
    }
  }

  static boolean publicAddress(InetAddress address) {
    byte[] b = address.getAddress();
    if (address.isAnyLocalAddress()
        || address.isLoopbackAddress()
        || address.isLinkLocalAddress()
        || address.isSiteLocalAddress()
        || address.isMulticastAddress()) return false;
    if (b.length == 4) {
      int a = b[0] & 255, c = b[1] & 255;
      return a != 0
          && a != 127
          && a != 10
          && a < 224
          && !(a == 100 && c >= 64 && c <= 127)
          && !(a == 169 && c == 254)
          && !(a == 172 && c >= 16 && c <= 31)
          && !(a == 192 && c == 168)
          && !(a == 198 && (c == 18 || c == 19));
    }
    return (b[0] & 0xfe) != 0xfc;
  }

  private synchronized void throttle(String host) throws InterruptedException {
    long wait = 1000 - (System.currentTimeMillis() - lastRequest.getOrDefault(host, 0L));
    if (wait > 0) Thread.sleep(wait);
    lastRequest.put(host, System.currentTimeMillis());
  }

  public Download download(String url) {
    URI uri = validate(url);
    String robotsUrl = uri.getScheme() + "://" + uri.getHost() + "/robots.txt";
    var robots = fetch(URI.create(robotsUrl), true);
    if (robots != null
        && !robotsAllow(
            new String(robots.bytes(), java.nio.charset.StandardCharsets.UTF_8), uri.getPath()))
      throw new ApiException(
          403,
          "ACADEMIC_SOURCE_NOT_VERIFIED",
          "O robots.txt não permite coletar este documento. Use importação manual verificada.");
    return fetch(uri, false);
  }

  static boolean robotsAllow(String body, String path) {
    boolean active = false;
    int allow = -1, deny = -1;
    for (String line : body.split("\\R")) {
      line = line.split("#", 2)[0].trim();
      int colon = line.indexOf(':');
      if (colon < 0) continue;
      String key = line.substring(0, colon).trim().toLowerCase(Locale.ROOT),
          value = line.substring(colon + 1).trim();
      if (key.equals("user-agent"))
        active = value.equals("*") || value.toLowerCase(Locale.ROOT).contains("enturmacatalog");
      else if (active && !value.isBlank() && (key.equals("allow") || key.equals("disallow"))) {
        String prefix = value.split("\\*", 2)[0].replace("$", "");
        if (path.startsWith(prefix)) {
          if (key.equals("allow")) allow = Math.max(allow, prefix.length());
          else deny = Math.max(deny, prefix.length());
        }
      }
    }
    return deny < 0 || allow >= deny;
  }

  private Download fetch(URI initial, boolean robots) {
    URI uri = initial;
    for (int redirect = 0; redirect < 4; redirect++) {
      validate(uri.toString());
      try {
        for (var address : InetAddress.getAllByName(uri.getHost()))
          if (!publicAddress(address))
            throw new ApiException(
                400, "ACADEMIC_SOURCE_NOT_VERIFIED", "Endereço de rede não permitido.");
        if (client == null)
          client =
              HttpClient.newBuilder()
                  .connectTimeout(Duration.ofSeconds(8))
                  .followRedirects(HttpClient.Redirect.NEVER)
                  .build();
        for (int attempt = 0; attempt < 3; attempt++) {
          throttle(uri.getHost());
          var request =
              HttpRequest.newBuilder(uri)
                  .timeout(Duration.ofSeconds(20))
                  .header(
                      "User-Agent",
                      "EnturmaCatalog/1.0 (+https://github.com/luizcordeiro155/Enturma)")
                  .header("Accept", "application/pdf,text/html,text/plain")
                  .GET()
                  .build();
          var response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
          int status = response.statusCode();
          try (var stream = response.body()) {
            if (status >= 300 && status < 400) {
              URI next = uri.resolve(response.headers().firstValue("location").orElseThrow());
              validate(next.toString());
              if (!next.getHost().equals(initial.getHost()))
                throw new ApiException(
                    400,
                    "ACADEMIC_SOURCE_NOT_VERIFIED",
                    "Redirecionamento entre domínios exige uma nova fonte revisada.");
              uri = next;
              break;
            }
            if (robots && status == 404) return null;
            if (Set.of(429, 502, 503, 504).contains(status) && attempt < 2) {
              Thread.sleep((attempt + 1) * 1500L);
              continue;
            }
            if (status != 200)
              throw new ApiException(
                  502,
                  "ACADEMIC_PROVIDER_UNAVAILABLE",
                  "Fonte indisponível (HTTP " + status + ").");
            int limit = robots ? 256 * 1024 : 8 * 1024 * 1024;
            var read =
                java.util.concurrent.CompletableFuture.supplyAsync(
                    () -> {
                      try {
                        return stream.readNBytes(limit + 1);
                      } catch (java.io.IOException e) {
                        throw new java.io.UncheckedIOException(e);
                      }
                    });
            byte[] bytes;
            try {
              bytes = read.get(20, java.util.concurrent.TimeUnit.SECONDS);
            } finally {
              if (!read.isDone()) read.cancel(true);
            }
            if (bytes.length > limit)
              throw ApiException.invalid("Documento excede o limite de download.");
            String mime = response.headers().firstValue("content-type").orElse("").split(";", 2)[0];
            boolean pdf =
                bytes.length >= 5
                    && new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII)
                        .equals("%PDF-");
            if (mime.equals("application/pdf") && !pdf)
              throw new ApiException(
                  400, "ACADEMIC_PARSE_FAILED", "O conteúdo recebido não é um PDF válido.");
            if (!robots && !pdf && !Set.of("text/html", "text/plain").contains(mime))
              throw ApiException.invalid("Tipo de documento não permitido.");
            return new Download(bytes, pdf ? "application/pdf" : mime, uri.toString());
          }
        }
      } catch (ApiException e) {
        throw e;
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new ApiException(503, "ACADEMIC_PROVIDER_UNAVAILABLE", "Coleta interrompida.");
      } catch (Exception e) {
        throw new ApiException(
            502,
            "ACADEMIC_PROVIDER_UNAVAILABLE",
            "Não foi possível consultar a fonte no prazo permitido.");
      }
    }
    throw new ApiException(400, "ACADEMIC_PROVIDER_UNAVAILABLE", "Redirecionamentos excedidos.");
  }
}
