ALTER TABLE ride_match ADD COLUMN closed_at timestamptz;
ALTER TABLE ride_match ADD COLUMN purge_at timestamptz;
ALTER TABLE ride_match ADD COLUMN deleted_at timestamptz;
CREATE INDEX ride_match_purge ON ride_match(purge_at) WHERE deleted_at IS NULL;
-- Existing ended rides get a full retention window from this upgrade.
UPDATE ride_match m SET closed_at=now(),purge_at=now()+interval '24 hours'
FROM ride r WHERE r.id=m.ride_id AND (r.status<>'OPEN' OR m.status IN ('CANCELLED','REJECTED'));
