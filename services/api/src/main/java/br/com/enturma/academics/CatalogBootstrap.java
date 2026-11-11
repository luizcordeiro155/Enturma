package br.com.enturma.academics;

import br.com.enturma.academics.provider.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Locale;
import org.springframework.core.io.ClassPathResource;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "enturma.catalog.bootstrap",
    havingValue = "true",
    matchIfMissing = true)
public class CatalogBootstrap {
  private final List<AcademicCatalogProvider> providers;
  private final CatalogImports imports;
  private final ObjectMapper json;

  public CatalogBootstrap(
      List<AcademicCatalogProvider> providers, CatalogImports imports, ObjectMapper json) {
    this.providers = providers;
    this.imports = imports;
    this.json = json;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void install() throws Exception {
    for (var provider : providers)
      if (provider instanceof SnapshotAcademicProvider) {
        var document = provider.importCurriculum();
        if (!document.entries().isEmpty())
          imports.seed(
              document,
              provider.providerCode()
                  + ":"
                  + CatalogImports.hash(json.writeValueAsString(document)));
      }
    // Incremental verified documents reuse the original provider identity, so existing
    // students, course IDs, and historic curricula stay intact.
    for (String provider : List.of("UNA", "PUCMINAS", "UFMG")) {
      var resource =
          new ClassPathResource(
              "catalog/expansions/" + provider.toLowerCase(Locale.ROOT) + ".json");
      try (var input = resource.getInputStream()) {
        var document = json.readValue(input, CatalogRecord.Document.class);
        if (!provider.equals(document.provider()))
          throw new IllegalStateException("Expansão acadêmica de provider inconsistente");
        imports.seed(
            document,
            provider + ":EXPANSION:" + CatalogImports.hash(json.writeValueAsString(document)));
      }
    }
    // Catalog-only offerings are stored separately from verified curriculum snapshots.
    // Import the official course lists using the same parent-first audited pipeline.
    // Courses without a documented curriculum remain selectable as requests only.
    for (String provider : List.of("UFMG", "PUCMINAS", "NEWTON")) {
      var resource = new ClassPathResource(
          "catalog/expansions/" + provider.toLowerCase(Locale.ROOT) + "-course-list.json");
      try (var input = resource.getInputStream()) {
        var document = json.readValue(input, CatalogRecord.Document.class);
        if (!provider.equals(document.provider()))
          throw new IllegalStateException("Provider de cursos inconsistente");
        if (document.entries().stream().anyMatch(
            entry -> !List.of("CAMPUS", "COURSE").contains(entry.kind())))
          throw new IllegalStateException("Lista de cursos nao pode conter grade ficticia");
        imports.seed(
            document,
            provider + ":OFFICIAL-COURSE-LIST:" + CatalogImports.hash(json.writeValueAsString(document)));
      }
    }
    // Separate, source-specific curricula must run only after their course offerings exist.
    var psychology = new ClassPathResource("catalog/expansions/newton-psychology-2021.json");
    try (var input = psychology.getInputStream()) {
      var document = json.readValue(input, CatalogRecord.Document.class);
      if (!"NEWTON".equals(document.provider()))
        throw new IllegalStateException("Grade de Psicologia Newton com provider inconsistente");
      imports.seed(
          document,
          "NEWTON:PSYCHOLOGY-2021:" + CatalogImports.hash(json.writeValueAsString(document)));
    }
    var siUberlandia = new ClassPathResource(
        "catalog/expansions/pucminas-si-uberlandia-2023.json");
    try (var input = siUberlandia.getInputStream()) {
      var document = json.readValue(input, CatalogRecord.Document.class);
      if (!"PUCMINAS".equals(document.provider()))
        throw new IllegalStateException("Grade PUC com provider inconsistente");
      imports.seed(
          document,
          "PUCMINAS:SI-UBERLANDIA-2023:"
              + CatalogImports.hash(json.writeValueAsString(document)));
    }
    for (String curriculumFile : List.of(
        "ufmg-estatistica-2024.json", "newton-computacao-2023.json")) {
      var curriculum = new ClassPathResource("catalog/expansions/" + curriculumFile);
      try (var input = curriculum.getInputStream()) {
        var document = json.readValue(input, CatalogRecord.Document.class);
        String expectedProvider = curriculumFile.startsWith("ufmg-") ? "UFMG" : "NEWTON";
        if (!expectedProvider.equals(document.provider()))
          throw new IllegalStateException("Provider de grade inconsistente");
        imports.seed(
            document,
            expectedProvider + ":COMPLETE-CURRICULUM:" + curriculumFile + ":"
                + CatalogImports.hash(json.writeValueAsString(document)));
      }
    }
  }
}
