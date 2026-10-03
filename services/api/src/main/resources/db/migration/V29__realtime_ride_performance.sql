-- Realtime/ride hot-path indexes.
-- Keeps match refreshes and accepted-seat checks fast as carpool volume grows.
CREATE INDEX IF NOT EXISTS ride_owner_created_idx
  ON ride(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ride_match_user_created_idx
  ON ride_match(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ride_match_accepted_idx
  ON ride_match(ride_id)
  WHERE status='ACCEPTED';

CREATE INDEX IF NOT EXISTS ride_match_active_idx
  ON ride_match(ride_id, status)
  WHERE deleted_at IS NULL;
