package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/private-account-vault")
public class AccountVaultController {
  private final Db db;
  private final ObjectMapper json;
  private final PasswordEncoder passwords;

  public AccountVaultController(Db db, ObjectMapper json, PasswordEncoder passwords) {
    this.db = db;
    this.json = json;
    this.passwords = passwords;
  }

  public record Envelope(
      @Min(3) @Max(3) int version,
      @Min(1) int epoch,
      @NotNull @Valid SocialController.PublicKey publicKey,
      @NotBlank @Pattern(regexp = "[A-Za-z0-9+/]{16}") String iv,
      @NotBlank @Size(min = 64, max = 12000) @Pattern(regexp = "[A-Za-z0-9+/]+={0,2}")
          String data) {}

  public record Password(@NotBlank @Size(max = 256) String password) {}

  @GetMapping
  public Object get(@AuthenticationPrincipal Actor actor) {
    var result = db.one("SELECT credential_version epoch FROM app_user WHERE id=?", actor.id());
    var rows = db.list("SELECT envelope FROM private_account_vault WHERE user_id=?", actor.id());
    if (!rows.isEmpty()) result.put("envelope", rows.getFirst().get("envelope"));
    return result;
  }

  @PostMapping("/verify")
  public Object verify(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Password request) {
    var user =
        db.one(
            "SELECT password_hash,credential_version epoch FROM app_user WHERE id=?", actor.id());
    if (!passwords.matches(request.password(), (String) user.get("passwordHash")))
      throw new ApiException(400, "PASSWORD_MISMATCH", "Confira a senha da sua conta.");
    return Map.of("epoch", user.get("epoch"));
  }

  @PutMapping
  @Transactional
  public void save(@AuthenticationPrincipal Actor actor, @Valid @RequestBody Envelope envelope)
      throws Exception {
    var user = db.one("SELECT credential_version FROM app_user WHERE id=? FOR UPDATE", actor.id());
    if (((Number) user.get("credentialVersion")).intValue() != envelope.epoch())
      throw new ApiException(
          409, "KEY_VERSION_CHANGED", "Entre novamente para atualizar a proteção das conversas.");
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM private_identity WHERE user_id=? AND public_key=?::jsonb)",
        actor.id(),
        json.writeValueAsString(envelope.publicKey())))
      throw ApiException.invalid("Preserve a identidade original das conversas.");
    int changed =
        db.jdbc.update(
            "INSERT INTO private_account_vault(user_id,credential_version,envelope) VALUES"
                + " (?,?,?::jsonb) ON CONFLICT(user_id) DO UPDATE SET"
                + " credential_version=excluded.credential_version,envelope=excluded.envelope,updated_at=now()"
                + " WHERE private_account_vault.credential_version<excluded.credential_version",
            actor.id(),
            envelope.epoch(),
            json.writeValueAsString(envelope));
    if (changed == 0)
      throw new ApiException(
          409,
          "ACCOUNT_VAULT_EXISTS",
          "A conta já sincronizou as conversas. Abra a chave existente.");
  }
}
