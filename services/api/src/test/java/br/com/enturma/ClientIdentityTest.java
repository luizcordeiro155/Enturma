package br.com.enturma;

import static org.junit.jupiter.api.Assertions.*;

import br.com.enturma.auth.ClientIdentity;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIdentityTest {
  private final String secret = "test-only-proxy-key-not-a-real-secret";
  private final String subject = "a".repeat(64);

  private MockHttpServletRequest signed(long timestamp, String key) throws Exception {
    var request = new MockHttpServletRequest();
    request.setRemoteAddr("127.0.0.1");
    String payload = timestamp + ":" + subject;
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    request.addHeader(
        "X-Enturma-Client",
        payload
            + ":"
            + HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8))));
    return request;
  }

  @Test
  void acceptsFreshSignedIdentity() throws Exception {
    assertEquals(
        "web:" + subject,
        new ClientIdentity(secret).subject(signed(Instant.now().getEpochSecond(), secret)));
  }

  @Test
  void rejectsExpiredOrForgedSignatures() throws Exception {
    var client = new ClientIdentity(secret);
    assertEquals(
        "127.0.0.1",
        client.subject(signed(Instant.now().minusSeconds(120).getEpochSecond(), secret)));
    assertEquals(
        "127.0.0.1", client.subject(signed(Instant.now().getEpochSecond(), "attacker-key")));
  }

  @Test
  void neverTrustsUnverifiedForwardedHeaders() {
    var request = new MockHttpServletRequest();
    request.setRemoteAddr("127.0.0.1");
    request.addHeader("X-Forwarded-For", "192.0.2.1");
    request.addHeader("X-Enturma-Client", "forged");
    assertEquals("127.0.0.1", new ClientIdentity(secret).subject(request));
    assertEquals("127.0.0.1", new ClientIdentity("").subject(request));
  }
}
