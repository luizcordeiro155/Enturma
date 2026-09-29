package br.com.enturma.academics.provider;

import br.com.enturma.academics.CatalogRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.core.io.ClassPathResource;

public abstract class SnapshotAcademicProvider implements AcademicCatalogProvider {
  private final String code;
  private final CatalogRecord.Document snapshot;

  protected SnapshotAcademicProvider(String code, ObjectMapper json) {
    this.code = code;
    var resource = new ClassPathResource("catalog/" + code.toLowerCase(Locale.ROOT) + ".json");
    try (var input = resource.getInputStream()) {
      snapshot = json.readValue(input, CatalogRecord.Document.class);
      if (!snapshot.provider().equals(code))
        throw new IllegalStateException("Provider inconsistente");
    } catch (Exception e) {
      throw new IllegalStateException("Snapshot acadêmico inválido: " + code, e);
    }
  }

  public String providerCode() {
    return code;
  }

  public boolean supports(String provider) {
    return code.equals(provider);
  }

  public Map<String, Object> discover() {
    return Map.of(
        "provider",
        code,
        "mode",
        "VERIFIED_SNAPSHOT",
        "items",
        snapshot.entries().size(),
        "curricula",
        snapshot.entries().stream().filter(e -> e.kind().equals("CURRICULUM")).count(),
        "sources",
        snapshot.entries().stream().map(CatalogRecord::source).distinct().toList());
  }

  public CatalogRecord.Document importCurriculum() {
    return snapshot;
  }
}
