ALTER TABLE ride_match ADD COLUMN boarding_attempts integer NOT NULL DEFAULT 0 CHECK(boarding_attempts BETWEEN 0 AND 5);
ALTER TABLE ride_match ADD COLUMN boarding_locked_at timestamptz;
CREATE TABLE ride_safety_check (
  match_id uuid PRIMARY KEY REFERENCES ride_match(id) ON DELETE CASCADE,
  route jsonb,
  expected_seconds integer,
  baseline_at timestamptz,
  last_sample_at timestamptz,
  off_route_since timestamptz,
  alert_kind varchar(16) CHECK(alert_kind IN ('ROUTE','DURATION')),
  alert_at timestamptz,
  acknowledged_at timestamptz,
  snoozed_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
