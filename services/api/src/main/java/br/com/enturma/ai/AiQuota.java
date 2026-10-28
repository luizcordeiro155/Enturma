package br.com.enturma.ai;

import br.com.enturma.auth.Actor;
import br.com.enturma.common.ApiException;
import br.com.enturma.common.Db;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Shared budget, committed before paid work and atomic across API instances. */
@Service
public class AiQuota {
  private final Db db;

  public AiQuota(Db db) {
    this.db = db;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void consume(Actor actor) {
    increment(actor);
  }

  /** Queue insertion and reservation commit together; no second pool connection is needed. */
  @Transactional(propagation = Propagation.MANDATORY)
  public void reserveQueued(Actor actor) {
    increment(actor);
  }

  private void increment(Actor actor) {
    var hits =
        db.jdbc.queryForList(
            "INSERT INTO rate_limit(bucket,hits,resets_at) VALUES (?,1,now()+interval '1 day')"
                + " ON CONFLICT(bucket) DO UPDATE SET"
                + " hits=CASE WHEN rate_limit.resets_at<now() THEN 1 ELSE rate_limit.hits+1 END,"
                + " resets_at=CASE WHEN rate_limit.resets_at<now() THEN now()+interval '1 day'"
                + " ELSE rate_limit.resets_at END"
                + " WHERE rate_limit.resets_at<now() OR rate_limit.hits<40 RETURNING hits",
            Integer.class,
            "ai:" + actor.id());
    if (hits.isEmpty())
      throw new ApiException(429, "AI_LIMIT", "Limite diário de 40 solicitações de IA atingido.");
  }
}
