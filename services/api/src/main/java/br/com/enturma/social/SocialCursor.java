package br.com.enturma.social;

import br.com.enturma.common.ApiException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/** Keyset boundaries are data, never SQL. Scope prevents accidental reuse across tabs. */
public record SocialCursor(Instant snapshot, Instant before, UUID id) {
  public static SocialCursor read(String raw, String scope) {
    if (raw == null || raw.isBlank())
      return new SocialCursor(Instant.now(), Instant.now(), new UUID(-1L, -1L));
    try {
      if (raw.length() > 400) throw new IllegalArgumentException();
      String[] parts =
          new String(Base64.getUrlDecoder().decode(raw), StandardCharsets.UTF_8).split("\\|", -1);
      if (parts.length != 4 || !parts[0].equals(scope)) throw new IllegalArgumentException();
      Instant snapshot = Instant.parse(parts[1]);
      if (snapshot.isAfter(Instant.now().plusSeconds(5))) throw new IllegalArgumentException();
      return new SocialCursor(snapshot, Instant.parse(parts[2]), UUID.fromString(parts[3]));
    } catch (RuntimeException e) {
      throw ApiException.invalid("A página expirou. Atualize o feed.");
    }
  }

  public String next(String scope, Map<String, Object> row) {
    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(
            (scope + "|" + snapshot + "|" + row.get("publishedAt") + "|" + row.get("id"))
                .getBytes(StandardCharsets.UTF_8));
  }
}
