package br.com.enturma.academics;

import br.com.enturma.common.Db;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Opt-in source checks only; changed content always requires human review. */
@Component
@ConditionalOnProperty(name = "enturma.catalog.sync-enabled", havingValue = "true")
public class CatalogSourceSchedule {
  private final Db db;
  private final CatalogSourcesController sources;
  private final int days;

  public CatalogSourceSchedule(
      Db db, CatalogSourcesController sources, @Value("${enturma.catalog.sync-days:14}") int days) {
    this.db = db;
    this.sources = sources;
    this.days = Math.max(7, days);
  }

  @Scheduled(initialDelay = 60000, fixedDelay = 3600000)
  public void check() {
    for (var source :
        db.list(
            "SELECT id FROM academic_source WHERE provider<>'LEGACY' AND"
                + " coalesce((metadata->>'lastCheckedAt')::timestamptz,retrieved_at)<now()-make_interval(days=>?)"
                + " ORDER BY updated_at LIMIT 3",
            days))
      try {
        sources.check(null, (UUID) source.get("id"));
      } catch (Exception e) {
        db.jdbc.update(
            "UPDATE academic_source SET"
                + " metadata=metadata||jsonb_build_object('lastCheckedAt',now(),'lastCheckError','ACADEMIC_PROVIDER_UNAVAILABLE'),updated_at=now()"
                + " WHERE id=?",
            source.get("id"));
        db.jdbc.update(
            "INSERT INTO academic_domain_event(id,type,entity_id) VALUES"
                + " (?,'SOURCE_CHECK_FAILED',?)",
            UUID.randomUUID(),
            source.get("id"));
      }
  }
}
