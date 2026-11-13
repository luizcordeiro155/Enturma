package br.com.enturma.social;

import br.com.enturma.common.Db;
import java.util.Map;
import org.springframework.dao.DataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** A bounded rollout probe: no account, infrastructure or credential details. */
@RestController
public class SocialReleaseController {
  private final Db db;

  public SocialReleaseController(Db db) {
    this.db = db;
  }

  @GetMapping("/api/v1/public/social-release")
  public ResponseEntity<Map<String, Object>> readiness() {
    boolean ready;
    try {
      ready = db.exists(
          "SELECT (SELECT count(*)=2 FROM flyway_schema_history WHERE version IN ('72','73')"
              + " AND success) AND (SELECT count(*)=5 FROM pg_class c JOIN pg_namespace n"
              + " ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relrowsecurity"
              + " AND c.relname IN ('social_live','social_comment_media','social_comment_like',"
              + " 'social_collection','social_collection_item'))");
    } catch (DataAccessException ex) {
      ready = false;
    }
    return ResponseEntity.status(ready ? 200 : 503).cacheControl(CacheControl.noStore())
        .body(Map.of("release", "social-figma-2026-11-13", "ready", ready));
  }
}
