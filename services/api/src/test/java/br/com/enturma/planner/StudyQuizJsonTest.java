package br.com.enturma.planner;

import static org.assertj.core.api.Assertions.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;

class StudyQuizJsonTest {
  @Test
  void latexBackslashesBecomeParseableJson() throws Exception {
    String raw = "{\"q\":\"Quanto vale \\lim_{x \\to 2} f(x)? Use \\\\ e \\n.\"}";
    String fixed = StudySessionService.escapeStrayBackslashes(raw);
    Map<String, Object> root = new ObjectMapper().readValue(fixed, new TypeReference<>() {});
    assertThat((String) root.get("q")).startsWith("Quanto vale \\lim_{x \t");
    assertThat((String) root.get("q")).contains("Use \\ e \n.");
  }

  @Test
  void validJsonIsLeftUntouched() {
    String ok = "{\"a\":\"linha\\nnova \\\"aspas\\\" \\u00e9\"}";
    assertThat(StudySessionService.escapeStrayBackslashes(ok)).isEqualTo(ok);
  }
}
