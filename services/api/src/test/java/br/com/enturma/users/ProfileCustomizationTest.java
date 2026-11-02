package br.com.enturma.users;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import br.com.enturma.academics.CatalogService;
import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import br.com.enturma.notifications.AppChanged;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validation;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;

class ProfileCustomizationTest {
  @Test
  void imageRemovalUsesAuthenticatedOwnerAndIsIdempotent() {
    var jdbc = mock(JdbcTemplate.class);
    var events = mock(ApplicationEventPublisher.class);
    var profiles =
        new ProfileService(new Db(jdbc, new ObjectMapper()), mock(CatalogService.class), events);
    var actor = new Actor(UUID.randomUUID(), UUID.randomUUID(), "USER");
    // One image exists initially; a repeat request makes no further mutation.
    when(jdbc.update(anyString(), eq(actor.id()))).thenReturn(1, 0, 1, 0);
    var controller = new ProfileController(profiles);
    controller.removeAvatar(actor);
    controller.removeAvatar(actor);
    controller.removeBanner(actor);
    controller.removeBanner(actor);
    var queries = ArgumentCaptor.forClass(String.class);
    verify(jdbc, times(4)).update(queries.capture(), eq(actor.id()));
    assertThat(queries.getAllValues().getFirst())
        .contains(
            "avatar_mime=NULL", "avatar_bytes=NULL", "WHERE id=? AND avatar_bytes IS NOT NULL");
    assertThat(queries.getAllValues().getLast())
        .contains(
            "banner_mime=NULL", "banner_bytes=NULL", "WHERE id=? AND banner_bytes IS NOT NULL");
    verify(events, times(2)).publishEvent(any(AppChanged.class));
  }

  @Test
  void acceptsOriginalAndEnturmaThemesButRejectsUnknownOrNullValues() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();
      for (String theme : new String[] {"LIGHT", "DARK", "SYSTEM", "ENTURMA"}) {
        assertThat(
                validator.validate(
                    new ExperienceController.Preference(theme, 1, false, false, true)))
            .isEmpty();
      }
      for (String theme : new String[] {"unknown", "", null}) {
        assertThat(
                validator.validate(
                    new ExperienceController.Preference(theme, 1, false, false, true)))
            .isNotEmpty();
      }
    }
  }
}
