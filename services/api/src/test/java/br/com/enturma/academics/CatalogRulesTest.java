package br.com.enturma.academics;

import static org.assertj.core.api.Assertions.*;

import br.com.enturma.common.ApiException;
import br.com.enturma.learning.LearningController;
import com.fasterxml.jackson.databind.json.JsonMapper;
import java.net.InetAddress;
import org.junit.jupiter.api.Test;

class CatalogRulesTest {
  @Test
  void rejectsUnsafeSources() throws Exception {
    for (String url :
        new String[] {
          "http://www.una.br/x",
          "https://localhost/x",
          "https://una.br.evil.test/x",
          "https://127.0.0.1/x",
          "https://user:pass@www.una.br/x",
          "https://www.una.br:444/x"
        })
      assertThatThrownBy(() -> AcademicHttpClient.validate(url)).isInstanceOf(ApiException.class);
    assertThat(AcademicHttpClient.validate("https://www.una.br/unidades/aimores").getHost())
        .isEqualTo("www.una.br");
    for (String ip :
        new String[] {
          "127.0.0.1", "10.1.1.1", "172.16.0.1", "192.168.1.1", "100.64.1.1", "::1", "fc00::1"
        }) assertThat(AcademicHttpClient.publicAddress(InetAddress.getByName(ip))).isFalse();
  }

  @Test
  void respectsRobots() {
    assertThat(
            AcademicHttpClient.robotsAllow(
                "User-agent: *\nDisallow: /private\nAllow: /private/public", "/private/data"))
        .isFalse();
    assertThat(
            AcademicHttpClient.robotsAllow(
                "User-agent: *\nDisallow: /private\nAllow: /private/public", "/private/public.pdf"))
        .isTrue();
  }

  @Test
  void csvPreservesQuotedNames() {
    var mapper = JsonMapper.builder().findAndAddModules().build();
    var doc =
        CatalogCsv.parse(
            "TEST",
            "externalId,kind,name,status,sourceUrl,sourceName,sourceType,retrievedAt\n"
                + "inst,INSTITUTION,\"Universidade,"
                + " Campus\",PENDING_VERIFICATION,https://www.una.br,UNA,OFFICIAL_WEBPAGE,2026-01-01T00:00:00Z",
            mapper);
    assertThat(doc.entries().getFirst().name()).isEqualTo("Universidade, Campus");
  }

  @Test
  void pdfNeverPublishesGuesses() {
    assertThatThrownBy(
            () ->
                new AcademicDocumentParser()
                    .parse("<html>not pdf</html>".getBytes(), "https://www.una.br/x"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void gameAnswersAreValidatedServerSide() {
    assertThat(LearningController.check("codeword", 1, "ARRAY")).isTrue();
    assertThat(LearningController.check("codeword", 1, "STACK")).isFalse();
    assertThat(LearningController.check("trace", 4, "12")).isTrue();
    assertThat(LearningController.check("trace", 4, "999")).isFalse();
    assertThat(
            LearningController.check(
                "robot",
                1,
                "DOWN;DOWN;DOWN;RIGHT;RIGHT;DOWN;RIGHT;RIGHT"))
        .isTrue();
    assertThat(LearningController.check("robot", 1, "RIGHT")).isFalse();
    assertThat(LearningController.check("robot", 1, "eval()")).isFalse();
    assertThatThrownBy(() -> LearningController.check("fake", 1, "10"))
        .isInstanceOf(ApiException.class);
  }
}
