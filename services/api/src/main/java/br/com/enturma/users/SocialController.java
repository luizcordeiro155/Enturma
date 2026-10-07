package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import br.com.enturma.notifications.AppChanged;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SocialController {
  private final Db db;
  private final br.com.enturma.notifications.NotificationService notices;
  private final ObjectMapper json;
  private final ApplicationEventPublisher events;

  public SocialController(
      Db db,
      ObjectMapper json,
      br.com.enturma.notifications.NotificationService notices,
      ApplicationEventPublisher events) {
    this.notices = notices;
    this.db = db;
    this.json = json;
    this.events = events;
  }

  private void friendsChanged(UUID... users) {
    events.publishEvent(new AppChanged("friends_changed", Set.copyOf(Arrays.asList(users))));
  }

  private void profileChanged(UUID user) {
    events.publishEvent(new AppChanged("profile_changed", Set.of()));
  }

  private void unblocked(UUID a, UUID b) {
    if (db.exists(
        "SELECT EXISTS(SELECT 1 FROM user_block WHERE (user_id=? AND blocked_id=?) OR (user_id=?"
            + " AND blocked_id=?))",
        a,
        b,
        b,
        a)) throw ApiException.forbidden();
  }

  @GetMapping("/users/{id}/profile")
  public Object profile(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    unblocked(a.id(), id);
    var profile =
        db.one(
            "SELECT id,name,username,bio,accent_color,profile_details,avatar_bytes IS NOT NULL"
                + " has_avatar,banner_bytes IS NOT NULL has_banner FROM app_user WHERE id=? AND"
                + " status='ACTIVE'",
            id);
    var appearance =
        db.list(
            "SELECT secondary_color,theme,effect,layout FROM profile_showcase WHERE user_id=?", id);
    if (!appearance.isEmpty()) profile.put("showcaseAppearance", appearance.getFirst());
    return profile;
  }

  public record Details(
      @Size(max = 40) String pronouns,
      @Size(max = 80) String statusText,
      @Pattern(regexp = "NONE|RING|GLOW|GRADIENT") String decoration,
      @Pattern(regexp = "SYSTEM|MONO|SERIF") String nameFont,
      @Size(max = 200) String website,
      @Size(max = 120) String interests) {}

  @PutMapping("/users/me/profile-details")
  public void details(@AuthenticationPrincipal Actor a, @Valid @RequestBody Details value)
      throws Exception {
    if (value.website() != null && !value.website().isBlank()) {
      try {
        var uri = java.net.URI.create(value.website());
        if (!Set.of("https", "http").contains(uri.getScheme())
            || uri.getHost() == null
            || uri.getUserInfo() != null) throw new IllegalArgumentException();
      } catch (IllegalArgumentException e) {
        throw ApiException.invalid("Informe um link HTTP ou HTTPS válido.");
      }
    }
    db.jdbc.update(
        "UPDATE app_user SET profile_details=?::jsonb WHERE id=?",
        json.writeValueAsString(value),
        a.id());
    profileChanged(a.id());
  }

  @GetMapping("/friends")
  public Object friends(@AuthenticationPrincipal Actor a) {
    return db.list(
        "SELECT f.id,f.requester,f.recipient,f.status,u.id"
            + " user_id,u.name,u.username,u.accent_color,u.profile_details,u.avatar_bytes IS NOT"
            + " NULL has_avatar FROM friendship f JOIN app_user u ON u.id=CASE WHEN f.requester=?"
            + " THEN f.recipient ELSE f.requester END WHERE (f.requester=? OR f.recipient=?) AND"
            + " u.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_block b WHERE (b.user_id=? AND"
            + " b.blocked_id=u.id) OR (b.blocked_id=? AND b.user_id=u.id)) ORDER BY f.created_at"
            + " DESC",
        a.id(),
        a.id(),
        a.id(),
        a.id(),
        a.id());
  }

  public record Invite(@NotBlank @Size(max = 40) String username) {}

  @PostMapping("/friends")
  public Object invite(@AuthenticationPrincipal Actor a, @Valid @RequestBody Invite input) {
    UUID peer =
        (UUID)
            db.one(
                    "SELECT id FROM app_user WHERE lower(username)=lower(?) AND status='ACTIVE'",
                    br.com.enturma.auth.AuthService.normalizeUsername(
                        input.username().replaceFirst("^@", "")))
                .get("id");
    if (peer.equals(a.id())) throw ApiException.invalid("Escolha outra pessoa.");
    unblocked(a.id(), peer);
    UUID id = UUID.randomUUID();
    int inserted =
        db.jdbc.update(
            "INSERT INTO friendship(id,requester,recipient) VALUES (?,?,?) ON CONFLICT DO NOTHING",
            id,
            a.id(),
            peer);
    var friendship =
        db.one(
            "SELECT id,status FROM friendship WHERE (requester=? AND recipient=?) OR (requester=? AND"
                + " recipient=?)",
            a.id(),
            peer,
            peer,
            a.id());
    if (inserted > 0) {
      UUID friendshipId = (UUID) friendship.get("id");
      notices.send(
          a.id(),
          peer,
          "FRIEND_REQUEST",
          "friend:" + friendshipId,
          friendshipId,
          "/friends",
          "Você recebeu uma solicitação de amizade.");
      friendsChanged(a.id(), peer);
    }
    return friendship;
  }

  private Map<String, Object> access(Actor a, UUID id, boolean accepted) {
    var f =
        db.one(
            "SELECT * FROM friendship WHERE id=? AND (requester=? OR recipient=?)",
            id,
            a.id(),
            a.id());
    unblocked((UUID) f.get("requester"), (UUID) f.get("recipient"));
    if (accepted && !"ACCEPTED".equals(f.get("status"))) throw ApiException.forbidden();
    return f;
  }

  @PostMapping("/friends/{id}/accept")
  public void accept(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    var f = access(a, id, false);
    if (!a.id().equals(f.get("recipient"))) throw ApiException.forbidden();
    db.jdbc.update("UPDATE friendship SET status='ACCEPTED' WHERE id=?", id);
    notices.send(
        a.id(),
        (UUID) f.get("requester"),
        "FRIEND_ACCEPTED",
        "friend:" + id,
        id,
        "/friends",
        "Sua solicitação de amizade foi aceita.");
    friendsChanged(a.id(), (UUID) f.get("requester"));
  }

  @DeleteMapping("/friends/{id}")
  public void remove(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    var f = access(a, id, false);
    UUID peer = a.id().equals(f.get("requester")) ? (UUID) f.get("recipient") : (UUID) f.get("requester");
    db.jdbc.update("DELETE FROM friendship WHERE id=?", id);
    friendsChanged(a.id(), peer);
  }

  @GetMapping("/private-identity")
  public Object identity(@AuthenticationPrincipal Actor a) {
    return db.list("SELECT public_key FROM private_identity WHERE user_id=?", a.id());
  }

  public record PublicKey(
      @NotBlank String kty,
      @NotBlank String crv,
      @NotNull @Pattern(regexp = "[A-Za-z0-9_-]{43}") String x,
      @NotNull @Pattern(regexp = "[A-Za-z0-9_-]{43}") String y) {}

  public record KeyVault(
      @Min(2) @Max(2) int version,
      @NotNull @Valid PublicKey publicKey,
      @NotBlank @Pattern(regexp = "[A-Za-z0-9+/]{43}=") String salt,
      @NotBlank @Pattern(regexp = "[A-Za-z0-9+/]{16}") String iv,
      @NotBlank @Size(min = 64, max = 12000) @Pattern(regexp = "[A-Za-z0-9+/]+={0,2}")
          String data) {}

  @GetMapping("/private-vault")
  public Object vault(@AuthenticationPrincipal Actor a) {
    return db.list("SELECT envelope,created_at FROM private_key_vault WHERE user_id=?", a.id());
  }

  @PutMapping("/private-vault")
  public void vault(@AuthenticationPrincipal Actor a, @Valid @RequestBody KeyVault value)
      throws Exception {
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM private_identity WHERE user_id=? AND public_key=?::jsonb)",
        a.id(),
        json.writeValueAsString(value.publicKey())))
      throw ApiException.invalid("Sincronize a chave original desta conta.");
    // A second device must unlock the existing vault, never replace its identity.
    if (db.jdbc.update(
            "INSERT INTO private_key_vault(user_id,envelope) VALUES (?,?::jsonb) ON CONFLICT DO"
                + " NOTHING",
            a.id(),
            json.writeValueAsString(value))
        == 0)
      throw new ApiException(
          409,
          "VAULT_EXISTS",
          "As conversas já estão sincronizadas. Use a senha das conversas para desbloquear este"
              + " dispositivo.");
  }

  @PutMapping("/private-identity")
  public void identity(@AuthenticationPrincipal Actor a, @Valid @RequestBody PublicKey key)
      throws Exception {
    if (!"EC".equals(key.kty()) || !"P-256".equals(key.crv()))
      throw ApiException.invalid("Chave incompatível.");
    String value = json.writeValueAsString(key);
    db.jdbc.update(
        "INSERT INTO private_identity(user_id,public_key) VALUES (?,?::jsonb) ON CONFLICT DO"
            + " NOTHING",
        a.id(),
        value);
    if (!db.exists(
        "SELECT EXISTS(SELECT 1 FROM private_identity WHERE user_id=? AND public_key=?::jsonb)",
        a.id(),
        value))
      throw new ApiException(
          409, "IDENTITY_EXISTS", "Restaure a chave original deste perfil usando seu backup.");
  }

  @GetMapping("/friends/{id}/identity")
  public Object peerKey(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    var f = access(a, id, true);
    Object peer = a.id().equals(f.get("requester")) ? f.get("recipient") : f.get("requester");
    return db.one("SELECT public_key FROM private_identity WHERE user_id=?", peer);
  }

  @GetMapping("/friends/{id}/messages")
  public Object messages(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @RequestParam(defaultValue = "0") int page) {
    access(a, id, true);
    return db.list(
        "SELECT id,sender_id,ciphertext,iv,client_id,created_at,attachment_ciphertext,"
            + " attachment_iv,attachment_mime,attachment_name,attachment_size FROM private_message WHERE"
            + " friendship_id=? ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET ?",
        id,
        Math.clamp(page, 0, 10000) * 50);
  }

  @GetMapping("/friends/{id}/messages/target/{target}")
  public Object messageTarget(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @PathVariable UUID target) {
    access(a, id, true);
    return db.list(
        "SELECT id,sender_id,ciphertext,iv,client_id,created_at,attachment_ciphertext,"
            + " attachment_iv,attachment_mime,attachment_name,attachment_size FROM private_message WHERE"
            + " friendship_id=? AND id=?",
        id,
        target);
  }

  public record PrivateMessageEdit(
      @NotBlank @Size(max = 24000) @Pattern(regexp = "[A-Za-z0-9+/=]+") String ciphertext,
      @NotBlank @Pattern(regexp = "[A-Za-z0-9+/]{16}") String iv) {}

  public record Envelope(
      @NotNull UUID clientId,
      @NotBlank @Size(max = 24000) @Pattern(regexp = "[A-Za-z0-9+/=]+") String ciphertext,
      @NotBlank @Pattern(regexp = "[A-Za-z0-9+/]{16}") String iv,
      Boolean mentioned,
      @Size(max = 2000000) @Pattern(regexp = "[A-Za-z0-9+/=]+") String attachmentCiphertext,
      @Pattern(regexp = "[A-Za-z0-9+/]{16}") String attachmentIv,
      @Pattern(regexp = "image/(jpeg|png|webp|gif)") String attachmentMime,
      @Size(max = 200) String attachmentName,
      @Min(1) @Max(1433600) Integer attachmentSize) {
    public Envelope(UUID clientId, String ciphertext, String iv) {
      this(clientId, ciphertext, iv, false, null, null, null, null, null);
    }

    boolean hasAttachment() {
      return attachmentCiphertext != null
          || attachmentIv != null
          || attachmentMime != null
          || attachmentName != null
          || attachmentSize != null;
    }

    boolean validAttachment() {
      return !hasAttachment()
          || (attachmentCiphertext != null
              && attachmentIv != null
              && attachmentMime != null
              && attachmentName != null
              && attachmentSize != null);
    }
  }

  @PostMapping("/friends/{id}/messages")
  @Transactional
  public void send(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Envelope body) {
    var friendship = access(a, id, true);
    if (!db.exists("SELECT EXISTS(SELECT 1 FROM private_identity WHERE user_id=?)", a.id()))
      throw ApiException.invalid("Configure a chave privada primeiro.");
    if (!body.validAttachment())
      throw ApiException.invalid("Anexo privado incompleto.");
    UUID message = UUID.randomUUID();
    int inserted =
        db.jdbc.update(
            "INSERT INTO private_message("
                + "id,friendship_id,sender_id,ciphertext,iv,client_id,"
                + "attachment_ciphertext,attachment_iv,attachment_mime,attachment_name,attachment_size"
                + ") VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(sender_id,client_id) DO NOTHING",
            message,
            id,
            a.id(),
            body.ciphertext(),
            body.iv(),
            body.clientId(),
            body.attachmentCiphertext(),
            body.attachmentIv(),
            body.attachmentMime(),
            body.attachmentName(),
            body.attachmentSize());
    if (inserted > 0) {
      UUID peer =
          (UUID)
              (a.id().equals(friendship.get("requester"))
                  ? friendship.get("recipient")
                  : friendship.get("requester"));
      notices.send(
          a.id(),
          peer,
          Boolean.TRUE.equals(body.mentioned()) ? "MENTION" : "PRIVATE_MESSAGE",
          "friend:" + id,
          message,
          "/friends?chat=" + id + "#message-" + message,
          Boolean.TRUE.equals(body.mentioned())
              ? "Você foi mencionado em uma conversa privada."
              : "Você recebeu uma mensagem privada.");
      friendsChanged(a.id(), peer);
    }
  }

  @PutMapping("/friends/{id}/messages/{messageId}")
  @Transactional
  public void editPrivateMessage(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @PathVariable UUID messageId,
      @Valid @RequestBody PrivateMessageEdit body) {
    var friendship = access(a, id, true);
    int updated =
        db.jdbc.update(
            "UPDATE private_message SET ciphertext=?,iv=? WHERE id=? AND friendship_id=? AND sender_id=?",
            body.ciphertext(),
            body.iv(),
            messageId,
            id,
            a.id());
    if (updated == 0) throw ApiException.missing();

    UUID peer =
        (UUID)
            (a.id().equals(friendship.get("requester"))
                ? friendship.get("recipient")
                : friendship.get("requester"));
    friendsChanged(a.id(), peer);
  }

  @DeleteMapping("/friends/{id}/messages/{messageId}")
  @Transactional
  public void deletePrivateMessage(
      @AuthenticationPrincipal Actor a,
      @PathVariable UUID id,
      @PathVariable UUID messageId) {
    var friendship = access(a, id, true);
    int deleted =
        db.jdbc.update(
            "DELETE FROM private_message WHERE id=? AND friendship_id=? AND sender_id=?",
            messageId,
            id,
            a.id());
    if (deleted == 0) throw ApiException.missing();

    db.jdbc.update(
        "DELETE FROM notification WHERE target_id=? AND kind IN ('PRIVATE_MESSAGE','MENTION')",
        messageId);

    UUID peer =
        (UUID)
            (a.id().equals(friendship.get("requester"))
                ? friendship.get("recipient")
                : friendship.get("requester"));
    friendsChanged(a.id(), peer);
  }

}
