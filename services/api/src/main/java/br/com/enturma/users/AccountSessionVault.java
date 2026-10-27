package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Account-authorized key custody. The application service can recover these keys; this deliberately
 * does not claim server-blind end-to-end encryption.
 */
@Service
public class AccountSessionVault {
  private final Db db;
  private final ObjectMapper json;
  private final SecretKeySpec master;
  private final SecureRandom random = new SecureRandom();

  public AccountSessionVault(Db db, ObjectMapper json, Environment env) {
    this.db = db;
    this.json = json;
    String configured = env.getProperty("CHAT_ACCOUNT_MASTER_KEY", "").trim();
    if (configured.isEmpty()) {
      master = null;
      return;
    }
    byte[] raw;
    try {
      raw = Base64.getDecoder().decode(configured);
    } catch (IllegalArgumentException e) {
      throw new IllegalStateException("CHAT_ACCOUNT_MASTER_KEY must be 32 base64-encoded bytes");
    }
    if (raw.length != 32)
      throw new IllegalStateException("CHAT_ACCOUNT_MASTER_KEY must be 32 base64-encoded bytes");
    master = new SecretKeySpec(raw, "AES");
    Arrays.fill(raw, (byte) 0);
  }

  public boolean enabled() {
    return master != null;
  }

  private void requireEnabled() {
    if (!enabled())
      throw new ApiException(
          503,
          "CHAT_SYNC_UNAVAILABLE",
          "A sincronização das conversas está temporariamente indisponível.");
  }

  private byte[] context(UUID user) {
    return ("enturma-account-session-key-v1:" + user).getBytes(StandardCharsets.UTF_8);
  }

  String seal(UUID user, byte[] raw) {
    requireEnabled();
    try {
      byte[] iv = new byte[12];
      random.nextBytes(iv);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, master, new GCMParameterSpec(128, iv));
      cipher.updateAAD(context(user));
      return "1."
          + Base64.getEncoder().encodeToString(iv)
          + "."
          + Base64.getEncoder().encodeToString(cipher.doFinal(raw));
    } catch (Exception e) {
      throw new IllegalStateException("Could not protect account sync key");
    }
  }

  String open(UUID user, String sealed) {
    requireEnabled();
    try {
      String[] fields = sealed.split("\\.");
      if (fields.length != 3 || !fields[0].equals("1")) throw new IllegalArgumentException();
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(
          Cipher.DECRYPT_MODE,
          master,
          new GCMParameterSpec(128, Base64.getDecoder().decode(fields[1])));
      cipher.updateAAD(context(user));
      byte[] raw = cipher.doFinal(Base64.getDecoder().decode(fields[2]));
      try {
        return Base64.getEncoder().encodeToString(raw);
      } finally {
        Arrays.fill(raw, (byte) 0);
      }
    } catch (Exception e) {
      // Do not replace an unreadable key: this could strand existing conversation history.
      throw new ApiException(
          503,
          "CHAT_SYNC_KEY_UNAVAILABLE",
          "Não foi possível abrir a proteção das conversas. Tente novamente mais tarde.");
    }
  }

  @Transactional
  public Object session(Actor actor) {
    requireEnabled();
    db.one("SELECT id FROM app_user WHERE id=? AND status='ACTIVE' FOR UPDATE", actor.id());
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM private_account_session_key WHERE user_id=?)", actor.id())) {
      byte[] raw = new byte[32];
      random.nextBytes(raw);
      try {
        db.jdbc.update(
            "INSERT INTO private_account_session_key(user_id,sealed_key) VALUES (?,?)",
            actor.id(),
            seal(actor.id(), raw));
      } finally {
        Arrays.fill(raw, (byte) 0);
      }
    }
    var row =
        db.one(
            "SELECT sealed_key,envelope FROM private_account_session_key WHERE user_id=?",
            actor.id());
    var result = new LinkedHashMap<String, Object>();
    result.put("key", open(actor.id(), (String) row.get("sealedKey")));
    result.put("epoch", 1);
    if (row.get("envelope") != null) result.put("envelope", row.get("envelope"));
    return result;
  }

  @Transactional
  public void save(Actor actor, AccountVaultController.Envelope envelope) throws Exception {
    requireEnabled();
    db.one("SELECT id FROM app_user WHERE id=? AND status='ACTIVE' FOR UPDATE", actor.id());
    if (envelope.epoch() != 1
        || !db.exists(
            "SELECT EXISTS(SELECT 1 FROM private_identity WHERE user_id=? AND public_key=?::jsonb)",
            actor.id(),
            json.writeValueAsString(envelope.publicKey())))
      throw ApiException.invalid(
          "A proteção deve preservar a identidade das conversas desta conta.");
    if (db.jdbc.update(
            "UPDATE private_account_session_key SET envelope=?::jsonb,synced_at=now() WHERE"
                + " user_id=? AND envelope IS NULL",
            json.writeValueAsString(envelope),
            actor.id())
        == 0)
      throw new ApiException(
          409, "CHAT_SYNC_EXISTS", "Abra a proteção já sincronizada desta conta.");
  }
}
