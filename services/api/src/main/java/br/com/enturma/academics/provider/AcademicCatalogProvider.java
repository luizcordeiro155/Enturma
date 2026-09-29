package br.com.enturma.academics.provider;

import br.com.enturma.academics.CatalogRecord;
import java.util.Map;

public interface AcademicCatalogProvider {
  String providerCode();

  boolean supports(String provider);

  Map<String, Object> discover();

  CatalogRecord.Document importCurriculum();
}
