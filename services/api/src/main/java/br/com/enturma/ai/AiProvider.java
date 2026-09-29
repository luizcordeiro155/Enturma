package br.com.enturma.ai;

import java.util.List;

public interface AiProvider {
  record ExternalSource(String title, String url, int startIndex, int endIndex) {}

  record Answer(
      String text,
      List<ExternalSource> sources,
      String model,
      Long inputTokens,
      Long outputTokens) {
    public Answer(String text, List<ExternalSource> sources) {
      this(text, sources, null, null, null);
    }
  }

  default Answer describeImage(byte[] bytes, String mime) {
    throw new br.com.enturma.common.ApiException(
        503, "VISION_UNAVAILABLE", "A leitura de imagens não está disponível neste provedor.");
  }

  Answer answer(String context, String question, String mode, boolean webSearch);

  default String answer(String context, String question, String mode) {
    return answer(context, question, mode, false).text();
  }

  boolean enabled();

  boolean webSearchEnabled();
}
