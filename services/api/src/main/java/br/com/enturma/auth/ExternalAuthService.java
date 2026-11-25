package br.com.enturma.auth;

import br.com.enturma.auth.AuthService.Credentials;
import br.com.enturma.auth.ExternalIdentityGateway.Profile;
import br.com.enturma.common.*;
import java.text.Normalizer;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Sign-in with Google, and the Google and GitHub accounts a student ties to the profile. */
@Service
public class ExternalAuthService {
  private static final String GOOGLE = "GOOGLE";
  private static final String GITHUB = "GITHUB";

  private final ExternalIdentityGateway gateway;
  private final AuthService auth;
  private final AccountRepository accounts;
  private final PasswordEncoder encoder;
  private final Db db;
  private final br.com.enturma.privacy.LegalConsents consents;

  public ExternalAuthService(
      ExternalIdentityGateway gateway,
      AuthService auth,
      AccountRepository accounts,
      PasswordEncoder encoder,
      Db db,
      br.com.enturma.privacy.LegalConsents consents) {
    this.gateway = gateway;
    this.auth = auth;
    this.accounts = accounts;
    this.encoder = encoder;
    this.db = db;
    this.consents = consents;
  }

  /** What the sign-in pages need to send someone to each provider. */
  public Map<String, Object> providers() {
    var out = new LinkedHashMap<String, Object>();
    for (String provider : List.of(GOOGLE, GITHUB)) {
      var row = new LinkedHashMap<String, Object>();
      row.put("enabled", gateway.enabled(provider));
      if (gateway.enabled(provider)) {
        row.put("clientId", gateway.clientId(provider));
        row.put("redirectUri", gateway.redirectUri(provider));
      }
      out.put(provider.toLowerCase(Locale.ROOT), row);
    }
    return out;
  }

  /** A session, and whether this sign-in is what created the account. */
  public record SignedIn(
      String accessToken, String refreshToken, long expiresIn, UUID userId, boolean created) {
    static SignedIn of(Credentials c, boolean created) {
      return new SignedIn(c.accessToken(), c.refreshToken(), c.expiresIn(), c.userId(), created);
    }
  }

  private Profile ask(String provider, String code, String codeVerifier) {
    if (!gateway.enabled(provider))
      throw new ApiException(
          503, "PROVIDER_UNAVAILABLE", "Essa forma de entrar não está disponível agora.");
    Profile profile = gateway.exchange(provider, code, codeVerifier);
    if (profile == null || profile.subject() == null || profile.subject().isBlank())
      throw new ApiException(
          502, "PROVIDER_FAILED", "Não foi possível confirmar sua conta agora. Tente de novo.");
    return profile;
  }

  private Optional<UUID> owner(String provider, String subject) {
    return db
        .list("SELECT user_id FROM user_identity WHERE provider=? AND subject=?", provider, subject)
        .stream()
        .map(row -> (UUID) row.get("userId"))
        .findFirst();
  }

  /**
   * Signs in with Google: the account already tied to that Google account, else the account with
   * the same e-mail, else a new account — and a new account only with the terms accepted.
   */
  @Transactional
  public SignedIn google(
      String code, String codeVerifier, String device, boolean acceptedTerms) {
    Profile profile = ask(GOOGLE, code, codeVerifier);
    UUID known = owner(GOOGLE, profile.subject()).orElse(null);
    if (known != null) return open(known, device);

    // From here the e-mail decides which account this is, so Google must vouch for it.
    String email =
        profile.email() == null ? "" : profile.email().strip().toLowerCase(Locale.ROOT);
    if (!profile.emailVerified() || email.isBlank() || email.length() > 254)
      throw new ApiException(
          403,
          "GOOGLE_EMAIL_UNVERIFIED",
          "Confirme o e-mail da sua conta Google antes de entrar com ela.");

    Account account = accounts.findByEmail(email).orElse(null);
    if (account != null) {
      db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", account.id);
      if (db.exists(
          "SELECT EXISTS(SELECT 1 FROM user_identity WHERE user_id=? AND provider=?)",
          account.id,
          GOOGLE))
        throw new ApiException(
            409,
            "GOOGLE_ACCOUNT_MISMATCH",
            "Esta conta do Enturma usa outra conta Google. Entre com ela ou com sua senha.");
      // Nobody proved this address here before: whoever made the account loses their way in.
      if (!account.emailVerified) reclaim(account.id);
      attach(account.id, GOOGLE, profile);
      return open(account.id, device);
    }

    if (!acceptedTerms)
      throw new ApiException(
          409,
          "GOOGLE_SIGNUP_NEEDS_TERMS",
          "Para criar sua conta com o Google, aceite os Termos e a Política de Privacidade.");
    String name = clean(profile.name());
    if (name.isBlank()) name = email.substring(0, email.indexOf('@'));
    Account created =
        new Account(
            name.substring(0, Math.min(100, name.length())),
            username(name, email),
            email,
            // Nobody knows this password; the account gets one through "forgot my password".
            encoder.encode(Tokens.create()));
    created.emailVerified = true;
    accounts.saveAndFlush(created);
    db.jdbc.update("UPDATE app_user SET password_set=false WHERE id=?", created.id);
    consents.recordSignUp(created.id);
    attach(created.id, GOOGLE, profile);
    return SignedIn.of(auth.session(created.id, device), true);
  }

  private SignedIn open(UUID user, String device) {
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM app_user WHERE id=? AND status='ACTIVE')", user))
      throw new ApiException(
          403, "ACCOUNT_UNAVAILABLE", "Esta conta não está disponível para login.");
    return SignedIn.of(auth.session(user, device), false);
  }

  /** Hands an unconfirmed account to the person Google says owns its e-mail. */
  private void reclaim(UUID user) {
    db.jdbc.update(
        "UPDATE app_user SET email_verified=true,password_hash=?,password_set=false,"
            + "credential_version=credential_version+1 WHERE id=?",
        encoder.encode(Tokens.create()),
        user);
    db.jdbc.update("UPDATE user_session SET revoked_at=now() WHERE user_id=?", user);
    db.jdbc.update("DELETE FROM account_token WHERE user_id=?", user);
    db.jdbc.update("DELETE FROM user_identity WHERE user_id=?", user);
    db.jdbc.update("UPDATE portfolio_profile SET github_auto=false WHERE user_id=?", user);
  }

  private void attach(UUID user, String provider, Profile profile) {
    String login = profile.login() == null ? "" : profile.login().strip();
    try {
      db.jdbc.update(
          "INSERT INTO user_identity(provider,subject,user_id,login) VALUES (?,?,?,?)",
          provider,
          profile.subject(),
          user,
          login.substring(0, Math.min(254, login.length())));
    } catch (DuplicateKeyException e) {
      throw inUse(provider);
    }
  }

  private static ApiException inUse(String provider) {
    return new ApiException(
        409,
        "IDENTITY_IN_USE",
        provider.equals(GOOGLE)
            ? "Essa conta Google já está conectada a outro perfil do Enturma."
            : "Essa conta do GitHub já está conectada a outro perfil do Enturma.");
  }

  /** Ties this profile to the provider account, replacing the one it had. */
  private void connect(Actor actor, String provider, Profile profile) {
    UUID holder = owner(provider, profile.subject()).orElse(null);
    if (holder != null && !holder.equals(actor.id())) throw inUse(provider);
    db.jdbc.update(
        "DELETE FROM user_identity WHERE user_id=? AND provider=?", actor.id(), provider);
    attach(actor.id(), provider, profile);
  }

  /** An existing account starts accepting a Google account as a way in. */
  @Transactional
  public void linkGoogle(Actor actor, String code, String codeVerifier) {
    Profile profile = ask(GOOGLE, code, codeVerifier);
    var account =
        db.one("SELECT email,email_verified FROM app_user WHERE id=? FOR UPDATE", actor.id());
    if (!Boolean.TRUE.equals(account.get("emailVerified"))) {
      // An unconfirmed account could belong to anyone; only its own address may vouch for it.
      boolean same =
          profile.emailVerified()
              && profile.email() != null
              && profile.email().strip().equalsIgnoreCase((String) account.get("email"));
      if (!same)
        throw new ApiException(
            409,
            "EMAIL_UNVERIFIED",
            "Confirme seu e-mail no Enturma antes de conectar uma conta Google diferente.");
      db.jdbc.update("UPDATE app_user SET email_verified=true WHERE id=?", actor.id());
    }
    connect(actor, GOOGLE, profile);
  }

  /** The GitHub account whose public repositories feed this student's portfolio. */
  @Transactional
  public void connectGithub(Actor actor, String code, String codeVerifier) {
    Profile profile = ask(GITHUB, code, codeVerifier);
    db.one("SELECT id FROM app_user WHERE id=? FOR UPDATE", actor.id());
    connect(actor, GITHUB, profile);
    // Repositories of another account were never offered: start its list from nothing.
    db.jdbc.update(
        "UPDATE portfolio_profile SET github_synced_at=NULL WHERE user_id=?", actor.id());
  }

  public Map<String, Object> identities(Actor actor) {
    var account = db.one("SELECT password_set,email_verified FROM app_user WHERE id=?", actor.id());
    var out = new LinkedHashMap<String, Object>();
    out.put("passwordSet", account.get("passwordSet"));
    out.put("emailVerified", account.get("emailVerified"));
    out.put(
        "identities",
        db.list(
            "SELECT provider,login,created_at FROM user_identity WHERE user_id=? ORDER BY provider",
            actor.id()));
    return out;
  }

  @Transactional
  public void unlink(Actor actor, String provider) {
    if (!List.of(GOOGLE, GITHUB).contains(provider)) throw ApiException.missing();
    var account = db.one("SELECT password_set FROM app_user WHERE id=? FOR UPDATE", actor.id());
    if (provider.equals(GOOGLE) && !Boolean.TRUE.equals(account.get("passwordSet")))
      throw new ApiException(
          409,
          "PASSWORD_NEEDED",
          "Sua conta entra só com o Google. Crie uma senha em \"Esqueci minha senha\" antes de"
              + " desconectar.");
    db.jdbc.update(
        "DELETE FROM user_identity WHERE user_id=? AND provider=?", actor.id(), provider);
    if (provider.equals(GITHUB))
      db.jdbc.update(
          "UPDATE portfolio_profile SET github_auto=false WHERE user_id=?", actor.id());
  }

  private static String clean(String value) {
    return value == null ? "" : value.replaceAll("\\p{Cntrl}", " ").strip();
  }

  /** A free handle from the person's name: "Ana Souza" becomes "anasouza", then "anasouza2"… */
  private String username(String name, String email) {
    String base = handle(name);
    if (base.length() < 3) base = handle(email.substring(0, email.indexOf('@')));
    if (base.length() < 3) base = "estudante";
    base = base.substring(0, Math.min(30, base.length()));
    if (!accounts.existsByUsername(base)) return base;
    var random = new java.security.SecureRandom();
    for (int i = 0; i < 20; i++) {
      String candidate = base + (i < 3 ? i + 2 : 1000 + random.nextInt(9000));
      if (!accounts.existsByUsername(candidate)) return candidate;
    }
    return base + "_" + Tokens.create().replaceAll("[^a-z0-9]", "").substring(0, 8);
  }

  private static String handle(String text) {
    return Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .replaceAll("[^a-z0-9]", "");
  }
}
