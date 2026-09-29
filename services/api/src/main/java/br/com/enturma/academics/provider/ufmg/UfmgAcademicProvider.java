package br.com.enturma.academics.provider.ufmg;

import br.com.enturma.academics.provider.SnapshotAcademicProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public final class UfmgAcademicProvider extends SnapshotAcademicProvider {
  public UfmgAcademicProvider(ObjectMapper json) {
    super("UFMG", json);
  }
}
