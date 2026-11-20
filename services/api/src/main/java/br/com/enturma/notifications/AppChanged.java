package br.com.enturma.notifications;

import java.util.Set;
import java.util.UUID;

public record AppChanged(String type, Set<UUID> users) {
  /**
   * XP was granted to this student. Only their own connections hear it, after the grant is
   * committed, so an open profile can fetch the new level.
   */
  public static void xp(org.springframework.context.ApplicationEventPublisher events, UUID user) {
    if (events != null && user != null) events.publishEvent(new AppChanged("xp_changed", Set.of(user)));
  }
}
