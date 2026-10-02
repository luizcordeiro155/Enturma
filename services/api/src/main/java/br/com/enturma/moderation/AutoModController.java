package br.com.enturma.moderation;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AutoModController {
  private final AutoModService service;
  private final Db db;

  public AutoModController(AutoModService service, Db db) {
    this.service = service;
    this.db = db;
  }

  @GetMapping("/moderation/mine")
  public Object mine(@AuthenticationPrincipal Actor a) {
    return service.mine(a);
  }

  public record Appeal(@NotBlank @Size(max = 2000) String reason) {}

  @PostMapping("/moderation/{id}/appeal")
  public void appeal(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Appeal p) {
    service.appeal(a, id, p.reason());
  }

  @GetMapping("/admin/moderation")
  public Object list(@AuthenticationPrincipal Actor a) {
    if (!a.admin()) throw ApiException.forbidden();
    return db.list(
        "SELECT c.*,u.name,coalesce(a.kind,'REVIEW') kind,a.ends_at,a.revoked_at FROM"
            + " moderation_case c JOIN app_user u ON u.id=c.user_id LEFT JOIN moderation_action a"
            + " ON a.case_id=c.id ORDER BY c.created_at DESC LIMIT 100");
  }

  @GetMapping("/admin/moderation/{id}/evidence")
  public Object evidence(@AuthenticationPrincipal Actor a, @PathVariable UUID id) {
    if (!a.admin()) throw ApiException.forbidden();
    return db.list("SELECT * FROM moderation_evidence WHERE case_id=? ORDER BY created_at", id);
  }

  public record Review(boolean revoke, @NotBlank @Size(max = 2000) String note) {}

  @PostMapping("/admin/moderation/{id}/review")
  public void review(
      @AuthenticationPrincipal Actor a, @PathVariable UUID id, @Valid @RequestBody Review p) {
    service.review(a, id, p.revoke(), p.note());
  }

  public record Action(
      @NotNull UUID userId,
      UUID roomId,
      @NotBlank @Pattern(regexp = "WARNING|MUTE|RESTRICTION|KICK|SUSPENSION|BAN") String kind,
      @Min(0) @Max(43200) int minutes,
      @NotBlank @Size(max = 60) String rule,
      @NotBlank @Size(max = 4000) String evidence,
      @NotNull UUID requestId) {}

  @PostMapping("/admin/moderation/actions")
  @Transactional
  public Object action(@AuthenticationPrincipal Actor a, @Valid @RequestBody Action p) {
    if (!a.admin() || a.id().equals(p.userId())) throw ApiException.forbidden();
    var target = db.one("SELECT role FROM app_user WHERE id=?", p.userId());
    if (!target.get("role").equals("USER") && !a.role().equals("SUPER_ADMIN"))
      throw ApiException.forbidden();
    if (Set.of("MUTE", "RESTRICTION", "SUSPENSION").contains(p.kind()) && p.minutes() == 0)
      throw ApiException.invalid("Informe a duração da medida temporária.");
    if (p.kind().equals("BAN") && p.minutes() != 0)
      throw ApiException.invalid("Banimento exige revisão humana e não tem prazo automático.");
    if (Set.of("BAN", "SUSPENSION").contains(p.kind()) && p.roomId() != null)
      throw ApiException.invalid("Suspensão e banimento são medidas de conta.");
    if (Set.of("MUTE", "KICK").contains(p.kind()) && p.roomId() == null)
      throw ApiException.invalid("Informe a sala.");
    return Map.of(
        "id",
        service.create(
            p.userId(),
            p.roomId(),
            p.rule(),
            p.kind(),
            p.minutes(),
            "ADMIN",
            a.id(),
            p.evidence(),
            "admin:" + a.id() + ":" + p.requestId()));
  }

  public record Host(
      @NotBlank @Pattern(regexp = "[a-z0-9.-]{3,253}") String host,
      @NotBlank @Size(max = 300) String reason) {}

  @PostMapping("/admin/moderation/blocked-hosts")
  public void host(@AuthenticationPrincipal Actor a, @Valid @RequestBody Host h) {
    if (!a.admin()) throw ApiException.forbidden();
    db.jdbc.update(
        "INSERT INTO moderation_blocked_host(host,reason,added_by) VALUES (?,?,?) ON CONFLICT(host)"
            + " DO UPDATE SET reason=EXCLUDED.reason",
        h.host(),
        h.reason(),
        a.id());
  }
}
