package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.common.ApiException;
import br.com.enturma.materials.DocumentParser;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import org.apache.pdfbox.pdmodel.*;
import org.junit.jupiter.api.Test;

class DocumentParserTest {
  private final DocumentParser parser = new DocumentParser();

  @Test
  void rejectsRenamedExecutables() {
    assertThatThrownBy(() -> parser.parse(new byte[] {'M', 'Z', 0, 1}, "aula.pdf"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void rejectsBinaryText() {
    assertThatThrownBy(() -> parser.parse(new byte[] {0, 1, 2}, "aula.txt"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void preservesUtf8AndLimitsChunks() {
    var parsed =
        parser.parse(
            "Revisão de transações e normalização".getBytes(StandardCharsets.UTF_8), "aula.txt");
    assertThat(parsed.chunks().getFirst().body()).contains("transações");
    assertThatThrownBy(
            () -> parser.parse("x".repeat(250000).getBytes(StandardCharsets.UTF_8), "aula.txt"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void recognizesPdfBySignatureNotExtension() throws Exception {
    try (var document = new PDDocument();
        var out = new ByteArrayOutputStream()) {
      document.addPage(new PDPage());
      document.save(out);
      assertThat(parser.parse(out.toByteArray(), "arquivo.bin").mime())
          .isEqualTo("application/pdf");
    }
  }
}
