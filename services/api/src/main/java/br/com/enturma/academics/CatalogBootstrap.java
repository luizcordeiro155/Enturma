package br.com.enturma.academics;

import br.com.enturma.academics.provider.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
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
  }
}
