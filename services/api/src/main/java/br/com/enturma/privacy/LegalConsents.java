package br.com.enturma.privacy;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Records which version of the Terms of Use and Privacy Policy each person accepted, and when. The
 * web shows {@link #VERSION} next to the documents; changing them means changing this value.
 */
@Service
@RestController
@RequestMapping("/api/v1/account/privacy/consents")
public class LegalConsents {
  /** Date of the Terms of Use and Privacy Policy in force. */
  public static final String VERSION = "2026-11-16";

  private final Db db;

  public LegalConsents(Db db) {
    this.db = db;
  }

  /** At sign-up the person accepts both documents and declares being 18 or older. */
  @Transactional
  public void recordSignUp(UUID user) {
    insert(user, List.of("TERMS", "PRIVACY", "AGE_18"), "SIGN_UP");
  }

  private void insert(UUID user, List<String> documents, String source) {
    for (String document : documents)
      db.jdbc.update(
          "INSERT INTO consent_record(id,user_id,document,version,source) VALUES (?,?,?,?,?) ON"
              + " CONFLICT(user_id,document,version) DO NOTHING",
          UUID.randomUUID(),
          user,
          document,
          VERSION,
          source);
  }

  /** The current version, whether this person accepted it, and every acceptance on record. */
  @GetMapping
  public Map<String, Object> view(@AuthenticationPrincipal Actor a) {
    var history =
        db.list(
            "SELECT document,version,source,accepted_at FROM consent_record WHERE user_id=? ORDER BY"
                + " accepted_at DESC,document",
            a.id());
    long current =
        history.stream()
            .filter(r -> VERSION.equals(r.get("version")))
            .map(r -> r.get("document"))
            .filter(d -> "TERMS".equals(d) || "PRIVACY".equals(d))
            .distinct()
            .count();
    var result = new LinkedHashMap<String, Object>();
    result.put("current", VERSION);
    result.put("accepted", current == 2);
    result.put("history", history);
    return result;
  }

  public record Accept(String version) {}

  @PostMapping
  public Map<String, Object> acceptRequest(@AuthenticationPrincipal Actor a, @RequestBody Accept body) {
    accept(a, body == null ? null : body.version());
    return view(a);
  }

  /** Accepts the documents in force; an older version cannot be accepted anymore. */
  @Transactional
  public void accept(Actor a, String version) {
    if (!VERSION.equals(version))
      throw ApiException.invalid("Leia a versão atual dos Termos e da Política de Privacidade.");
    insert(a.id(), List.of("TERMS", "PRIVACY"), "IN_APP");
  }
}
