package br.com.enturma.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ProxiedAddressTest {
  private static String resolve(String remote, Map<String, String> headers) {
    return ProxiedAddress.resolve(remote, headers::get);
  }

  @Test
  void internalProxyForwardsCloudflareClientAddress() {
    assertEquals(
        "203.0.113.7", resolve("10.0.0.4", Map.of("CF-Connecting-IP", "203.0.113.7")));
  }

  @Test
  void internalProxyUsesTheAddressItAppendedToForwardedFor() {
    assertEquals(
        "198.51.100.9",
        resolve("172.18.0.2", Map.of("X-Forwarded-For", "1.2.3.4, 198.51.100.9")));
  }

  @Test
  void publicPeerCannotSpoofItsAddress() {
    assertEquals(
        "198.51.100.20",
        resolve(
            "198.51.100.20",
            Map.of("CF-Connecting-IP", "203.0.113.7", "X-Forwarded-For", "203.0.113.7")));
  }

  @Test
  void invalidForwardedValuesKeepTheSocketAddress() {
    assertEquals(
        "10.0.0.4",
        resolve("10.0.0.4", Map.of("CF-Connecting-IP", "evil.example", "X-Forwarded-For", "")));
    assertEquals("127.0.0.1", resolve("127.0.0.1", Map.of()));
  }

  @Test
  void loopbackPeersAreLocalProcessesAndAreNeverTrusted() {
    assertEquals(
        "127.0.0.1",
        resolve("127.0.0.1", Map.of("CF-Connecting-IP", "203.0.113.7", "X-Forwarded-For", "203.0.113.7")));
  }

  @Test
  void ipv6ClientsAndIpv4MappedProxiesAreSupported() {
    assertEquals(
        "2001:db8::1", resolve("::ffff:10.1.2.3", Map.of("CF-Connecting-IP", "2001:db8::1")));
    assertEquals("2001:db8::5", resolve("2001:db8::5", Map.of("CF-Connecting-IP", "2001:db8::1")));
  }
}
