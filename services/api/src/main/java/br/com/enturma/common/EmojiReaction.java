package br.com.enturma.common;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;

/** Unicode emoji catalog, including skin tones, flags and ZWJ sequences. */
public final class EmojiReaction {
  private static final Set<String> ALLOWED = load();

  private EmojiReaction() {}

  private static Set<String> load() {
    try (var input = EmojiReaction.class.getResourceAsStream("/emoji-reactions.txt")) {
      if (input == null) throw new IllegalStateException("Emoji catalog missing");
      return new String(input.readAllBytes(), StandardCharsets.UTF_8)
          .lines()
          .collect(Collectors.toUnmodifiableSet());
    } catch (java.io.IOException e) {
      throw new IllegalStateException("Cannot read emoji catalog", e);
    }
  }

  public static void validate(String value) {
    if (value == null || !ALLOWED.contains(value))
      throw ApiException.invalid("Escolha um emoji válido.");
  }
}
