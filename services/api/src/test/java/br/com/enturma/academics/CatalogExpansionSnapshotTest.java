package br.com.enturma.academics;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.HashSet;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

/** Structural integrity of staged institutional records; not a substitute for source verification. */
class CatalogExpansionSnapshotTest {
  private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

  @Test
  void reviewedExpansionsHaveCompleteIdentitySourcesAndPeriods() throws Exception {
    for (String provider : List.of("UNA", "UFMG", "PUCMINAS", "NEWTON")) {
      String path =
          provider.equals("NEWTON")
              ? "catalog/newton.json"
              : "catalog/expansions/" + provider.toLowerCase(java.util.Locale.ROOT) + ".json";
      try (var input = new ClassPathResource(path).getInputStream()) {
        var document = mapper.readValue(input, CatalogRecord.Document.class);
        assertThat(document.provider()).isEqualTo(provider);
        String evidenceFile = "catalog/evidence/" + provider.toLowerCase(java.util.Locale.ROOT) + ".json";
        String evidence;
        try (var evidenceStream = new ClassPathResource(evidenceFile).getInputStream()) {
          evidence = new String(evidenceStream.readAllBytes(), StandardCharsets.UTF_8);
        }
        String evidenceSha256 = CatalogImports.hash(evidence);
        assertThat(mapper.readTree(evidence).get("provider").asText()).isEqualTo(provider);
        assertThat(document.entries()).isNotEmpty();
        Set<String> identities = new HashSet<>();
        for (var entry : document.entries()) {
          assertThat(identities.add(entry.kind() + ":" + entry.externalId())).isTrue();
          assertThat(entry.status()).isEqualTo("VERIFIED");
          assertThat(entry.source().url()).startsWith("https://");
          assertThat(entry.source().verifiedAt()).isNotNull();
          assertThat(entry.source().contentHash()).isEqualTo(evidenceSha256);
          assertThat(entry.source().type()).isEqualTo("MANUAL_VERIFIED");
          if (!entry.kind().equals("INSTITUTION"))
            assertThat(entry.parentExternalId()).isNotBlank();
          if (entry.kind().equals("CURRICULUM"))
            assertThat(entry.curriculumVersion()).isNotBlank();
          if (entry.kind().equals("PERIOD"))
            assertThat(entry.periodNumber()).isPositive();
        }
        assertThat(document.entries().stream().filter(e -> e.kind().equals("COURSE")))
            .hasSize(1);
        assertThat(document.entries().stream().filter(e -> e.kind().equals("SUBJECT")))
            .isNotEmpty();
        var ids = document.entries().stream()
            .map(e -> e.kind() + ":" + e.externalId()).collect(java.util.stream.Collectors.toSet());
        for (var entry : document.entries()) {
          if (entry.kind().equals("INSTITUTION")) continue;
          var parentKind = switch (entry.kind()) {
            case "CAMPUS" -> "INSTITUTION";
            case "COURSE" -> "CAMPUS";
            case "CURRICULUM" -> "COURSE";
            case "PERIOD" -> "CURRICULUM";
            case "SUBJECT" -> "PERIOD";
            default -> throw new IllegalStateException("Unexpected kind: " + entry.kind());
          };
          if (entry.kind().equals("COURSE") && !provider.equals("NEWTON") && !provider.equals("PUCMINAS")) continue;
          if (entry.kind().equals("CAMPUS") && !provider.equals("NEWTON") && !provider.equals("PUCMINAS")) continue;
          assertThat(ids).contains(parentKind + ":" + entry.parentExternalId());
        }
      }
    }
  }
}
