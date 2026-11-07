package br.com.enturma.academics;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

/** Structural integrity of staged institutional records; not a substitute for source verification. */
class CatalogExpansionSnapshotTest {
  private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

  @Test
  void expansionsAreConsistentAndDoNotPublishUnverifiedCurricula() throws Exception {
    for (String provider : List.of("UNA", "UFMG", "PUCMINAS", "NEWTON")) {
      String path =
          provider.equals("NEWTON")
              ? "catalog/newton.json"
              : "catalog/expansions/" + provider.toLowerCase(java.util.Locale.ROOT) + ".json";
      try (var input = new ClassPathResource(path).getInputStream()) {
        var document = mapper.readValue(input, CatalogRecord.Document.class);
        assertThat(document.provider()).isEqualTo(provider);
        assertThat(document.entries()).isNotEmpty();
        Set<String> identities = new HashSet<>();
        for (var entry : document.entries()) {
          assertThat(identities.add(entry.kind() + ":" + entry.externalId())).isTrue();
          assertThat(entry.status()).isEqualTo("PENDING_VERIFICATION");
          assertThat(entry.source().url()).startsWith("https://");
          assertThat(entry.source().verifiedAt()).isNull();
          assertThat(entry.source().contentHash()).isNull();
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
      }
    }
  }
}
