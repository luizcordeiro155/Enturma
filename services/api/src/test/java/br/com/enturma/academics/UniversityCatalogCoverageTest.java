package br.com.enturma.academics;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class UniversityCatalogCoverageTest {
  private final ObjectMapper json = new ObjectMapper().registerModule(new JavaTimeModule());

  private record Coverage(String provider, String file, String evidence, int courses, int curricula,
                          int periods, int subjects) {}

  @Test
  void sourcedUniversityCatalogsHaveNoDuplicateIdsOrFabricatedCurricula() throws Exception {
    var snapshots = List.of(
        new Coverage("UFMG", "ufmg-course-list.json", "ufmg-course-list.json", 94, 0, 0, 0),
        new Coverage("PUCMINAS", "pucminas-course-list.json", "pucminas-course-list.json", 133, 0, 0, 0),
        new Coverage("NEWTON", "newton-course-list.json", "newton-course-list.json", 44, 0, 0, 0),
        new Coverage("NEWTON", "newton-psychology-2021.json", "newton-psychology-2021.json", 0, 1, 10, 63),
        new Coverage("PUCMINAS", "pucminas-si-uberlandia-2023.json",
            "pucminas-si-uberlandia-2023.json", 1, 1, 8, 52),
        new Coverage("UFMG", "ufmg-estatistica-2024.json",
            "ufmg-estatistica-2024.json", 0, 1, 8, 31),
        new Coverage("NEWTON", "newton-computacao-2023.json",
            "newton-computacao-2023.json", 0, 1, 8, 49));

    Map<String, String> parents = Map.of(
        "CAMPUS", "INSTITUTION", "COURSE", "CAMPUS", "CURRICULUM", "COURSE",
        "PERIOD", "CURRICULUM", "SUBJECT", "PERIOD");
    for (var spec : snapshots) {
      String filePath = "catalog/expansions/" + spec.file();
      String evidencePath = "catalog/evidence/" + spec.evidence();
      CatalogRecord.Document document;
      try (var data = new ClassPathResource(filePath).getInputStream()) {
        document = json.readValue(data, CatalogRecord.Document.class);
      }
      String evidence;
      try (var input = new ClassPathResource(evidencePath).getInputStream()) {
        evidence = new String(input.readAllBytes(), StandardCharsets.UTF_8);
      }
      String sourceHash = CatalogImports.hash(evidence);
      assertThat(json.readTree(evidence).get("provider").asText()).isEqualTo(spec.provider());
      assertThat(document.provider()).isEqualTo(spec.provider());
      assertThat(document.entries().stream().filter(e -> e.kind().equals("COURSE")).count())
          .isEqualTo(spec.courses());
      assertThat(document.entries().stream().filter(e -> e.kind().equals("CURRICULUM")).count())
          .isEqualTo(spec.curricula());
      assertThat(document.entries().stream().filter(e -> e.kind().equals("PERIOD")).count())
          .isEqualTo(spec.periods());
      assertThat(document.entries().stream().filter(e -> e.kind().equals("SUBJECT")).count())
          .isEqualTo(spec.subjects());
      Set<String> seen = new HashSet<>();
      for (var entry : document.entries()) {
        assertThat(seen.add(entry.kind() + ":" + entry.externalId())).isTrue();
        assertThat(entry.status()).isEqualTo("VERIFIED");
        assertThat(entry.source().contentHash()).isEqualTo(sourceHash);
        assertThat(entry.source().url()).startsWith("https://");
        assertThat(entry.source().verifiedAt()).isNotNull();
        assertThat(entry.source().name()).isNotBlank();
        if (!entry.kind().equals("INSTITUTION"))
          assertThat(entry.parentExternalId()).isNotBlank();
        if (entry.kind().equals("CURRICULUM"))
          assertThat(entry.curriculumVersion()).isNotBlank();
        if (entry.kind().equals("PERIOD"))
          assertThat(entry.periodNumber()).isPositive();
        if (entry.kind().equals("SUBJECT"))
          assertThat(entry.attributes().path("orderIndex").asInt()).isGreaterThanOrEqualTo(0);
      }
      assertThat(document.entries()).allMatch(e -> parents.containsKey(e.kind()));
    }
  }

  @Test
  void historicalPsychologyHasAllTenPeriodsAndCorrectSourceWorkload() throws Exception {
    CatalogRecord.Document document;
    try (var input = new ClassPathResource(
        "catalog/expansions/newton-psychology-2021.json").getInputStream()) {
      document = json.readValue(input, CatalogRecord.Document.class);
    }
    int workload = document.entries().stream().filter(e -> e.kind().equals("SUBJECT"))
        .mapToInt(e -> e.attributes().path("workloadHours").asInt()).sum();
    assertThat(workload).isEqualTo(4320);
    assertThat(document.entries().stream().filter(e -> e.kind().equals("PERIOD"))
        .map(CatalogRecord::periodNumber).sorted().toList())
        .containsExactly(1,2,3,4,5,6,7,8,9,10);
  }
}
