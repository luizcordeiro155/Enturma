package br.com.enturma.auth;

import java.util.Locale;
import java.util.regex.Pattern;

/** Validates the platform and client name the web server reports for a session. */
final class SessionClient {
  private static final Pattern UNSAFE = Pattern.compile("[^\\p{L}\\p{N} .·()_-]");

  private SessionClient() {}

  static String platform(String value) {
    if (value == null) return null;
    return switch (value.trim().toLowerCase(Locale.ROOT)) {
      case "web" -> "WEB";
      case "desktop" -> "DESKTOP";
      case "android" -> "ANDROID";
      default -> null;
    };
  }

  static String name(String value) {
    if (value == null) return null;
    String clean = UNSAFE.matcher(value).replaceAll("").replaceAll("\\s+", " ").trim();
    if (clean.isEmpty()) return null;
    return clean.length() > 60 ? clean.substring(0, 60).trim() : clean;
  }
}
