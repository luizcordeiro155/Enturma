package br.com.enturma.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Identifies anonymous web clients only when the BFF signs the platform-provided IP hash. */
@Component
public class ClientIdentity {
  private final String secret;

  public ClientIdentity(@Value("${BFF_PROXY_SECRET:}") String secret) {
    this.secret = secret;
  }

  public String subject(HttpServletRequest request) {
    String fallback = request.getRemoteAddr();
    String header = request.getHeader("X-Enturma-Client");
    if (secret.length() < 32 || header == null || header.length() > 150) return fallback;
    try {
      String[] parts = header.split(":", -1);
      if (parts.length != 3
          || !parts[1].matches("[a-f0-9]{64}")
          || !parts[2].matches("[a-f0-9]{64}")) return fallback;
      long timestamp = Long.parseLong(parts[0]);
      long now = Instant.now().getEpochSecond();
      if (timestamp < now - 60 || timestamp > now + 60) return fallback;
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      byte[] expected = mac.doFinal((parts[0] + ":" + parts[1]).getBytes(StandardCharsets.UTF_8));
      if (MessageDigest.isEqual(expected, HexFormat.of().parseHex(parts[2])))
        return "web:" + parts[1];
    } catch (Exception ignored) {
      /* Invalid assertions use the socket identity. */
    }
    return fallback;
  }
}
