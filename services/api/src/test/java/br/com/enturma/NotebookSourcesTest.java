package br.com.enturma;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.ai.NotebookSources;
import br.com.enturma.materials.DocumentParser;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class NotebookSourcesTest {
  @Test
  void rejectsPrivateNetworksAndUnsafeSchemes() throws Exception {
    for (String ip :
        new String[] {
          "127.0.0.1",
          "10.0.0.1",
          "169.254.169.254",
          "100.64.0.1",
          "192.168.1.1",
          "::1",
          "fc00::1",
          "fe80::1",
          "::ffff:127.0.0.1"
        }) assertThat(NotebookSources.publicAddress(InetAddress.getByName(ip))).isFalse();
    for (String url :
        new String[] {
          "file:///etc/passwd",
          "http://example.com",
          "https://user:pass@example.com",
          "https://example.com:8080"
        })
      assertThatThrownBy(() -> NotebookSources.validateUrl(url))
          .isInstanceOf(RuntimeException.class);
    assertThat(NotebookSources.publicAddress(InetAddress.getByName("93.184.216.34"))).isTrue();
    assertThatThrownBy(() -> new NotebookSources(new DocumentParser()).link("https://127.0.0.1"))
        .isInstanceOf(RuntimeException.class);
  }

  @Test
  void parsesDocumentsWithoutExecutingContent() throws Exception {
    var parser = new NotebookSources(new DocumentParser());
    String text = "Um algoritmo é uma sequência finita de instruções para resolver um problema.";
    assertThat(parser.document(text.getBytes(StandardCharsets.UTF_8), "aula.md"))
        .contains("algoritmo");
    var bytes = new java.io.ByteArrayOutputStream();
    try (var zip = new java.util.zip.ZipOutputStream(bytes)) {
      zip.putNextEntry(new java.util.zip.ZipEntry("word/document.xml"));
      zip.write(
          ("<w:document xmlns:w='urn:w'><w:p><w:t>" + text + "</w:t></w:p></w:document>")
              .getBytes(StandardCharsets.UTF_8));
      zip.closeEntry();
    }
    assertThat(parser.document(bytes.toByteArray(), "aula.docx")).contains(text);
  }
}
