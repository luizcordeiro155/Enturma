package br.com.enturma.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Locale;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.Profiles;

/** Adapts provider connection URIs after .env and profile configuration have been loaded. */
public final class DatabaseUrlEnvironmentPostProcessor
    implements EnvironmentPostProcessor, Ordered {
  @Override
  public int getOrder() {
    return ConfigDataEnvironmentPostProcessor.ORDER + 1;
  }

  @Override
  public void postProcessEnvironment(
      ConfigurableEnvironment environment, SpringApplication application) {
    String value = environment.getProperty("spring.datasource.url");
    if (value == null) return;
    value = value.trim();
    if (value.startsWith("jdbc:postgresql:")) {
      checkPublicHost(environment, value);
      return;
    }

    var properties = new LinkedHashMap<String, Object>();
    URI uri;
    try {
      uri = URI.create(value);
      if (!("postgresql".equals(uri.getScheme()) || "postgres".equals(uri.getScheme()))
          || uri.getHost() == null
          || uri.getRawPath() == null
          || uri.getRawPath().length() < 2
          || uri.getFragment() != null
          || uri.getPort() == 0
          || uri.getPort() > 65535) {
        throw new IllegalArgumentException();
      }
      String credentials = uri.getRawUserInfo();
      if (credentials != null) {
        int colon = credentials.indexOf(':');
        if (colon < 1) throw new IllegalArgumentException();
        properties.put("spring.datasource.username", decode(credentials.substring(0, colon)));
        properties.put("spring.datasource.password", decode(credentials.substring(colon + 1)));
      }
    } catch (IllegalArgumentException exception) {
      // URI parser errors include the input, which may contain a database password.
      throw new IllegalStateException(
          "DATABASE_URL invalida. Use jdbc:postgresql://HOST:PORT/BANCO ou a URI publica "
              + "postgresql://USUARIO:SENHA@HOST:PORT/BANCO, sem aspas.");
    }
    checkPublicHost(environment, uri.getHost());
    String authority = uri.getRawAuthority();
    authority = authority.substring(authority.lastIndexOf('@') + 1);
    String query = uri.getRawQuery();
    properties.put(
        "spring.datasource.url",
        "jdbc:postgresql://" + authority + uri.getRawPath() + (query == null ? "" : "?" + query));
    environment
        .getPropertySources()
        .addFirst(new MapPropertySource("postgresConnectionUri", properties));
  }

  private static String decode(String value) {
    // '+' is literal in URI userinfo, unlike form/query encoding.
    return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
  }

  private static void checkPublicHost(ConfigurableEnvironment environment, String value) {
    if (environment.acceptsProfiles(Profiles.of("squarecloud"))
        && value.toLowerCase(Locale.ROOT).contains(".railway.internal")) {
      throw new IllegalStateException(
          "DATABASE_URL usa a rede privada do Railway, inacessivel pela SquareCloud. "
              + "Use DATABASE_PUBLIC_URL de Connect > Public Network (host e porta do TCP Proxy).");
    }
  }
}
