package br.com.enturma.auth;

import java.util.List;

/** The conversations with Google and GitHub. Nothing they hand over is stored here. */
public interface ExternalIdentityGateway {
  /** Who the person is at the provider. {@code login} is what the student recognises it by. */
  record Profile(String subject, String login, String email, boolean emailVerified, String name) {}

  /** A public repository, as anyone can see it. */
  record Repository(
      String fullName,
      String name,
      String description,
      String homepage,
      String language,
      List<String> topics,
      int stars,
      boolean fork,
      boolean archived,
      String pushedAt) {}

  /** Whether this provider's credentials are configured on this server. */
  boolean enabled(String provider);

  String clientId(String provider);

  /** Where the provider sends the person back; it is registered at the provider as written. */
  String redirectUri(String provider);

  /** Trades the one-time code from the provider's consent page for the person's identity. */
  Profile exchange(String provider, String code, String codeVerifier);

  /** The public repositories this GitHub user owns, the most recently worked on first. */
  List<Repository> repositories(String login);
}
