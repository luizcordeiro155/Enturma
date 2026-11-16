package br.com.enturma.auth;

import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Resolves the client address behind the hosting platform's reverse proxy.
 *
 * <p>On Square Cloud every request reaches the JVM from an internal proxy, so the socket address
 * is the same for all clients. Forwarded headers are trusted only when the peer itself is an
 * internal (private, loopback or link-local) address: a client connecting from the internet
 * cannot spoof them. {@code CF-Connecting-IP} is set by the Cloudflare edge; otherwise the last
 * {@code X-Forwarded-For} entry, appended by the nearest proxy, is used.
 */
public final class ProxiedAddress {
  private static final Logger log = LoggerFactory.getLogger(ProxiedAddress.class);
  private static final Pattern IPV4 =
      Pattern.compile("(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}");
  private static final Pattern IPV6 = Pattern.compile("[0-9A-Fa-f:.]{2,45}");
  private static final AtomicInteger diagnostics = new AtomicInteger();

  private ProxiedAddress() {}

  public static String resolve(String remote, Function<String, String> header) {
    if (remote == null || !internal(remote)) return remote;
    String cloudflare = literal(header.apply("CF-Connecting-IP"));
    if (cloudflare != null) return cloudflare;
    String forwarded = header.apply("X-Forwarded-For");
    if (forwarded != null) {
      String[] hops = forwarded.split(",");
      String last = literal(hops[hops.length - 1]);
      if (last != null) return last;
    }
    if (diagnostics.getAndIncrement() < 3) {
      List<String> present = new ArrayList<>();
      for (String name : List.of("CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP", "Forwarded"))
        if (header.apply(name) != null) present.add(name);
      log.warn("client-identity: internal proxy without a usable client address; headers={}", present);
    }
    return remote;
  }

  static boolean internal(String value) {
    InetAddress address = parse(value);
    if (address == null) return false;
    byte[] raw = address.getAddress();
    if (raw.length == 16 && (raw[0] & 0xfe) == 0xfc) return true; // fc00::/7
    if (raw.length == 4 && (raw[0] & 0xff) == 100 && (raw[1] & 0xc0) == 64) return true; // CGNAT
    return address.isLoopbackAddress()
        || address.isSiteLocalAddress()
        || address.isLinkLocalAddress();
  }

  private static String literal(String value) {
    if (value == null) return null;
    String candidate = value.trim();
    InetAddress address = parse(candidate);
    return address == null ? null : candidate;
  }

  private static InetAddress parse(String value) {
    String v = value.trim();
    boolean v4 = IPV4.matcher(v).matches();
    if (!v4 && !(v.indexOf(':') >= 0 && IPV6.matcher(v).matches())) return null;
    try {
      return InetAddress.getByName(v); // a literal: no DNS lookup
    } catch (Exception e) {
      return null;
    }
  }
}
