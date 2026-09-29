package br.com.enturma.ai;

import java.util.List;

public interface AiProvider {
  record ExternalSource(String title, String url, int startIndex, int endIndex) {}

  record Answer(String text, List<ExternalSource> sources) {}

  Answer answer(String context, String question, String mode, boolean webSearch);

  default Answer answer(String context, String question, String mode) {
    return answer(context, question, mode, false);
  }

  boolean enabled();

  boolean webSearchEnabled();
}
