package br.com.enturma.academics.provider.pucminas;

import br.com.enturma.academics.provider.SnapshotAcademicProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public final class PucMinasAcademicProvider extends SnapshotAcademicProvider {
  public PucMinasAcademicProvider(ObjectMapper json) {
    super("PUCMINAS", json);
  }
}
