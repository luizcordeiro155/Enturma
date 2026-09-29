package br.com.enturma.auth;

import java.util.UUID;

public record Actor(UUID id, UUID sessionId, String role) {
  public boolean admin() {
    return role.equals("ADMIN") || role.equals("SUPER_ADMIN");
  }
}
