package br.com.enturma.auth;

import br.com.enturma.common.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final AccountRepository accounts;
  private final PasswordEncoder encoder;
  private final Db db;
  private final String appUrl;
  private final String dummyHash;

  public AuthService(
      AccountRepository accounts,
      PasswordEncoder encoder,
      Db db,
      @Value("${enturma.app-url}") String appUrl) {
    this.accounts = accounts;
    this.encoder = encoder;
    this.db = db;
    this.appUrl = appUrl;
    dummyHash = encoder.encode(Tokens.create());
  }

  public record Credentials(String accessToken, String refreshToken, long expiresIn, UUID userId) {}

  @Transactional
  public Credentials register(
      String name, String username, String email, String password, String device) {
    validatePassword(password);
    String normalizedEmail = email.strip().toLowerCase(Locale.ROOT);
    String normalizedUsername = normalizeUsername(username);

    if (accounts.existsByEmail(normalizedEmail))
      throw new ApiException(
          409, "EMAIL_ALREADY_REGISTERED", "Já existe uma conta cadastrada com este e-mail.");
    if (accounts.existsByUsername(normalizedUsername))
      throw new ApiException(
          409, "USERNAME_ALREADY_REGISTERED", "Este nome de usuário já está em uso.");

    Account user =
        new Account(name.strip(), normalizedUsername, normalizedEmail, encoder.encode(password));
    try {
      accounts.saveAndFlush(user);
    } catch (org.springframework.dao.DataIntegrityViolationException ex) {
      if (accounts.existsByEmail(normalizedEmail))
        throw new ApiException(
            409, "EMAIL_ALREADY_REGISTERED", "Já existe uma conta cadastrada com este e-mail.");
      if (accounts.existsByUsername(normalizedUsername))
        throw new ApiException(
            409, "USERNAME_ALREADY_REGISTERED", "Este nome de usuário já está em uso.");
      throw ex;
    }
    issueAccountToken(user, "VERIFY");
    return session(user.id, device);
  }

  public static String normalizeUsername(String username) {
    String value =
        java.text.Normalizer.normalize(
            username.strip().toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFC);
    if (!value.matches("[\\p{L}\\p{M}\\p{N}_]{1,40}"))
      throw ApiException.invalid(
          "Use um nome com até 40 letras (acentos são aceitos), números ou _.");
    return value;
  }

  @Transactional
  public Credentials login(String email, String password, String device) {
    Account user = accounts.findByEmail(email.strip().toLowerCase(Locale.ROOT)).orElse(null);
    boolean matches = encoder.matches(password, user == null ? dummyHash : user.passwordHash);
    if (user == null || !matches || !user.status.equals("ACTIVE"))
      throw new ApiException(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
    return session(user.id, device);
  }

  private Credentials session(UUID user, String device) {
    String access = Tokens.create(), refresh = Tokens.create();
    db.jdbc.update(
        "INSERT INTO"
            + " user_session(id,user_id,device,access_hash,access_expires_at,refresh_hash,expires_at)"
            + " VALUES (?,?,?,?,now()+interval '10 minutes',?,now()+interval '30 days')",
        UUID.randomUUID(),
        user,
        device,
        Tokens.hash(access),
        Tokens.hash(refresh));
    return new Credentials(access, refresh, 600, user);
  }

  @Transactional(noRollbackFor = ApiException.class)
  public Credentials refresh(String refresh) {
    String hash = Tokens.hash(refresh);
    var rows =
        db.list(
            "SELECT s.* FROM user_session s JOIN app_user u ON u.id=s.user_id WHERE"
                + " s.refresh_hash=? AND s.revoked_at IS NULL AND s.expires_at>now() AND"
                + " u.status='ACTIVE' FOR UPDATE OF s",
            hash);
    if (rows.isEmpty()) {
      db.jdbc.update(
          "UPDATE user_session SET revoked_at=now() WHERE id IN (SELECT session_id FROM"
              + " used_refresh_token WHERE token_hash=?)",
          hash);
      throw new ApiException(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
    }
    var s = rows.getFirst();
    String access = Tokens.create(), next = Tokens.create();
    db.jdbc.update(
        "INSERT INTO used_refresh_token(token_hash,session_id) VALUES (?,?)", hash, s.get("id"));
    db.jdbc.update(
        "UPDATE user_session SET access_hash=?,refresh_hash=?,access_expires_at=now()+interval '10"
            + " minutes' WHERE id=?",
        Tokens.hash(access),
        Tokens.hash(next),
        s.get("id"));
    return new Credentials(access, next, 600, (UUID) s.get("userId"));
  }

  public Optional<Actor> authenticate(String token) {
    return db
        .list(
            "SELECT s.id,s.user_id,u.role FROM user_session s JOIN app_user u ON u.id=s.user_id"
                + " WHERE access_hash=? AND access_expires_at>now() AND expires_at>now() AND"
                + " revoked_at IS NULL AND u.status='ACTIVE'",
            Tokens.hash(token))
        .stream()
        .map(r -> new Actor((UUID) r.get("userId"), (UUID) r.get("id"), (String) r.get("role")))
        .findFirst();
  }

  @Transactional
  public void resendVerification(Actor actor) {
    Account user = accounts.findById(actor.id()).orElseThrow();
    if (user.emailVerified) return;
    issueAccountToken(user, "VERIFY");
  }

  @Transactional
  public void recover(String email) {
    accounts
        .findByEmail(email.strip().toLowerCase(Locale.ROOT))
        .filter(u -> u.status.equals("ACTIVE"))
        .ifPresent(u -> issueAccountToken(u, "RESET"));
  }

  private void issueAccountToken(Account user, String purpose) {
    String raw = Tokens.create();
    db.jdbc.update("DELETE FROM account_token WHERE user_id=? AND purpose=?", user.id, purpose);
    db.jdbc.update(
        "INSERT INTO account_token VALUES (?,?,?,?)",
        Tokens.hash(raw),
        user.id,
        purpose,
        Timestamp.from(Instant.now().plusSeconds(1800)));
    String route = purpose.equals("VERIFY") ? "verify-email" : "reset-password";
    db.jdbc.update(
        "INSERT INTO email_outbox(id,recipient,subject,body) VALUES (?,?,?,?)",
        UUID.randomUUID(),
        user.email,
        "Enturma — " + (purpose.equals("VERIFY") ? "Confirme seu e-mail" : "Recupere sua senha"),
        "Acesse em até 30 minutos: " + appUrl + "/" + route + "#token=" + raw);
  }

  @Transactional
  public void consume(String token, String purpose, String password) {
    if (purpose.equals("RESET")) validatePassword(password);
    var rows =
        db.list(
            "DELETE FROM account_token WHERE token_hash=? AND purpose=? AND expires_at>now()"
                + " RETURNING user_id",
            Tokens.hash(token),
            purpose);
    if (rows.isEmpty()) throw ApiException.invalid("Link inválido ou expirado.");
    Object user = rows.getFirst().get("userId");
    if (purpose.equals("VERIFY"))
      db.jdbc.update("UPDATE app_user SET email_verified=true WHERE id=?", user);
    else {
      db.jdbc.update(
          "UPDATE app_user SET password_hash=? WHERE id=?", encoder.encode(password), user);
      db.jdbc.update("UPDATE user_session SET revoked_at=now() WHERE user_id=?", user);
    }
  }

  public void logout(Actor actor) {
    db.jdbc.update(
        "UPDATE user_session SET revoked_at=now() WHERE id=? AND user_id=?",
        actor.sessionId(),
        actor.id());
  }

  private void validatePassword(String password) {
    if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
      throw ApiException.invalid("A senha pode ter até 72 bytes em UTF-8.");
  }

  public Object sessions(Actor actor) {
    return db.list(
        "SELECT id,device,created_at,expires_at FROM user_session WHERE user_id=? AND revoked_at IS"
            + " NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 50",
        actor.id());
  }

  public void revoke(Actor actor, UUID id) {
    db.jdbc.update(
        "UPDATE user_session SET revoked_at=now() WHERE id=? AND user_id=?", id, actor.id());
  }
}
