package br.com.enturma.ai;

public interface AiProvider {
  String answer(String context, String question, String mode);

  boolean enabled();
}
