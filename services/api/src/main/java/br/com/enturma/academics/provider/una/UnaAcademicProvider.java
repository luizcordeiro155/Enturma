package br.com.enturma.academics.provider.una;

import br.com.enturma.academics.provider.SnapshotAcademicProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

@Component
public final class UnaAcademicProvider extends SnapshotAcademicProvider {
  public UnaAcademicProvider(ObjectMapper json) {
    super("UNA", json);
  }
}
