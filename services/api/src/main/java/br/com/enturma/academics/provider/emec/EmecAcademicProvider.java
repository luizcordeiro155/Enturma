package br.com.enturma.academics.provider.emec;

import br.com.enturma.academics.CatalogRecord;
import br.com.enturma.academics.provider.AcademicCatalogProvider;
import br.com.enturma.common.ApiException;
import java.net.URI;
import java.util.*;
import org.springframework.stereotype.Component;

/**
 * Imports operator-supplied public e-MEC exports; never bypasses the registry's access controls.
 */
@Component
public final class EmecAcademicProvider implements AcademicCatalogProvider {
  public String providerCode() {
    return "EMEC";
  }

  public boolean supports(String provider) {
    return "EMEC".equals(provider);
  }

  public Map<String, Object> discover() {
    return Map.of(
        "provider",
        "EMEC",
        "mode",
        "OFFICIAL_EXPORT",
        "items",
        0,
        "curricula",
        0,
        "sources",
        List.of(),
        "message",
        "Importe uma exportação pública oficial em JSON ou CSV. O e-MEC não fornece a distribuição"
            + " curricular por período.");
  }

  public CatalogRecord.Document importCurriculum() {
    throw ApiException.invalid("Envie uma exportação oficial do e-MEC em JSON ou CSV.");
  }

  public void validate(CatalogRecord.Document document) {
    for (var e : document.entries()) {
      String host = URI.create(e.source().url()).getHost();
      if (!Set.of("INSTITUTION", "CAMPUS", "COURSE").contains(e.kind())
          || !e.source().type().equals("EMEC")
          || host == null
          || !(host.equals("mec.gov.br")
              || host.endsWith(".mec.gov.br")
              || host.equals("gov.br")
              || host.endsWith(".gov.br")))
        throw ApiException.invalid(
            "O provider e-MEC aceita somente instituições, campi e ofertas provenientes de fonte"
                + " governamental.");
    }
  }
}
