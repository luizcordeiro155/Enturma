package br.com.enturma.academics.provider.newton;

import br.com.enturma.academics.provider.SnapshotAcademicProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public final class NewtonAcademicProvider extends SnapshotAcademicProvider {
  public NewtonAcademicProvider(ObjectMapper json) {
    super("NEWTON", json);
  }
}
