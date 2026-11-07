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
  }
}
