-- Align driver availability storage with the realtime dispatch service.
-- V36 stored route endpoints and telemetry but not the current map position
-- or the instant when the driver explicitly became available.

ALTER TABLE ride_driver_availability
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS online_at timestamptz;

UPDATE ride_driver_availability
SET lat = COALESCE(lat, start_lat),
    lng = COALESCE(lng, start_lng),
    online_at = COALESCE(online_at, updated_at, created_at, now())
WHERE lat IS NULL OR lng IS NULL OR online_at IS NULL;

ALTER TABLE ride_driver_availability
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN lng SET NOT NULL,
  ALTER COLUMN online_at SET DEFAULT now();

ALTER TABLE ride_driver_availability
  ADD CONSTRAINT ride_driver_live_lat_check
    CHECK(lat BETWEEN -90 AND 90),
  ADD CONSTRAINT ride_driver_live_lng_check
    CHECK(lng BETWEEN -180 AND 180);

CREATE INDEX IF NOT EXISTS ride_driver_live_position
  ON ride_driver_availability(campus_id, direction, status, updated_at)
  WHERE enabled AND status='ONLINE';

CREATE INDEX IF NOT EXISTS ride_driver_online_at
  ON ride_driver_availability(online_at DESC)
  WHERE enabled;
