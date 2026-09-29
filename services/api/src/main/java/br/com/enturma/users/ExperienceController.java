package br.com.enturma.users;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.Db;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me/experience")
public class ExperienceController {
  private final Db db;
  public ExperienceController(Db db) { this.db = db; }

  public record Preference(
      @Pattern(regexp="LIGHT|DARK|SYSTEM") String theme,
      @DecimalMin("0.85") @DecimalMax("1.35") double fontScale,
      boolean highContrast,
      boolean reducedMotion,
      boolean enhancedFocus) {}

  @GetMapping
  public Object get(@AuthenticationPrincipal Actor a) {
    db.jdbc.update("INSERT INTO user_experience_preference(user_id) VALUES (?) ON CONFLICT DO NOTHING", a.id());
    return db.one(
        "SELECT theme,font_scale,high_contrast,reduced_motion,enhanced_focus FROM"
            + " user_experience_preference WHERE user_id=?",
        a.id());
  }

  @PutMapping
  @Transactional
  public Object save(@AuthenticationPrincipal Actor a, @Valid @RequestBody Preference p) {
    db.jdbc.update(
        "INSERT INTO user_experience_preference(user_id,theme,font_scale,high_contrast,reduced_motion,enhanced_focus)"
            + " VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET theme=EXCLUDED.theme,"
            + " font_scale=EXCLUDED.font_scale,high_contrast=EXCLUDED.high_contrast,"
            + " reduced_motion=EXCLUDED.reduced_motion,enhanced_focus=EXCLUDED.enhanced_focus,updated_at=now()",
        a.id(), p.theme(), p.fontScale(), p.highContrast(), p.reducedMotion(), p.enhancedFocus());
    return Map.of("saved", true);
  }
}
