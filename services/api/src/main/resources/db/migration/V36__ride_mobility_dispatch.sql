-- Enturma Caronas v2: dispatch on-demand, mapa real e disponibilidade do motorista.

ALTER TABLE ride
  ADD COLUMN dispatch_mode varchar(20) NOT NULL DEFAULT 'SCHEDULED',
  ADD COLUMN start_label varchar(240),
  ADD COLUMN start_lat double precision,
  ADD COLUMN start_lng double precision,
  ADD COLUMN end_label varchar(240),
  ADD COLUMN end_lat double precision,
  ADD COLUMN end_lng double precision,
  ADD COLUMN route_distance_m int,
  ADD COLUMN route_duration_s int,
  ADD COLUMN search_started_at timestamptz;

ALTER TABLE ride
  ADD CONSTRAINT ride_dispatch_mode_check CHECK(dispatch_mode IN ('SCHEDULED','ON_DEMAND')),
  ADD CONSTRAINT ride_start_lat_check CHECK(start_lat IS NULL OR start_lat BETWEEN -90 AND 90),
  ADD CONSTRAINT ride_start_lng_check CHECK(start_lng IS NULL OR start_lng BETWEEN -180 AND 180),
  ADD CONSTRAINT ride_end_lat_check CHECK(end_lat IS NULL OR end_lat BETWEEN -90 AND 90),
  ADD CONSTRAINT ride_end_lng_check CHECK(end_lng IS NULL OR end_lng BETWEEN -180 AND 180),
  ADD CONSTRAINT ride_route_distance_check CHECK(route_distance_m IS NULL OR route_distance_m>=0),
  ADD CONSTRAINT ride_route_duration_check CHECK(route_duration_s IS NULL OR route_duration_s>=0);

CREATE UNIQUE INDEX ride_active_ondemand_request
  ON ride(owner_id)
  WHERE dispatch_mode='ON_DEMAND' AND type='REQUEST' AND status='OPEN';

CREATE TABLE ride_user_mobility_pref (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES academic_entry(id),
  home_label varchar(240),
  home_lat double precision,
  home_lng double precision,
  onboarding_done boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(home_lat IS NULL OR home_lat BETWEEN -90 AND 90),
  CHECK(home_lng IS NULL OR home_lng BETWEEN -180 AND 180)
);

CREATE TABLE ride_driver_availability (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  campus_id uuid NOT NULL REFERENCES academic_entry(id),
  direction varchar(20) NOT NULL CHECK(direction IN ('TO_CAMPUS','FROM_CAMPUS')),
  seats int NOT NULL CHECK(seats BETWEEN 1 AND 8),
  enabled boolean NOT NULL DEFAULT true,
  status varchar(20) NOT NULL DEFAULT 'ONLINE'
    CHECK(status IN ('OFFLINE','ONLINE','REQUESTED','BUSY')),
  start_label varchar(240) NOT NULL,
  start_lat double precision NOT NULL CHECK(start_lat BETWEEN -90 AND 90),
  start_lng double precision NOT NULL CHECK(start_lng BETWEEN -180 AND 180),
  end_label varchar(240) NOT NULL,
  end_lat double precision NOT NULL CHECK(end_lat BETWEEN -90 AND 90),
  end_lng double precision NOT NULL CHECK(end_lng BETWEEN -180 AND 180),
  heading double precision,
  speed_mps double precision,
  accuracy_m int,
  offer_ride_id uuid REFERENCES ride(id) ON DELETE SET NULL,
  pending_match_id uuid REFERENCES ride_match(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(heading IS NULL OR heading BETWEEN 0 AND 360),
  CHECK(speed_mps IS NULL OR speed_mps BETWEEN 0 AND 100),
  CHECK(accuracy_m IS NULL OR accuracy_m BETWEEN 0 AND 50000)
);
CREATE INDEX ride_driver_available
  ON ride_driver_availability(campus_id,direction,status,updated_at)
  WHERE enabled AND status='ONLINE';

CREATE TABLE ride_dispatch_attempt (
  request_ride_id uuid NOT NULL REFERENCES ride(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  match_id uuid REFERENCES ride_match(id) ON DELETE SET NULL,
  outcome varchar(20) NOT NULL CHECK(outcome IN ('OFFERED','ACCEPTED','REJECTED','EXPIRED','CANCELLED')),
  score numeric(10,2),
  detour_m int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(request_ride_id,driver_id)
);

CREATE TABLE ride_cancellation (
  id uuid PRIMARY KEY,
  ride_id uuid REFERENCES ride(id) ON DELETE SET NULL,
  match_id uuid REFERENCES ride_match(id) ON DELETE SET NULL,
  actor_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  reason varchar(40) NOT NULL,
  note varchar(300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ride_cancellation_actor ON ride_cancellation(actor_id,created_at DESC);

ALTER TABLE ride_live_location
  ADD COLUMN heading double precision,
  ADD COLUMN speed_mps double precision,
  ADD COLUMN captured_at timestamptz;

ALTER TABLE ride_live_location
  ADD CONSTRAINT ride_live_heading_check CHECK(heading IS NULL OR heading BETWEEN 0 AND 360),
  ADD CONSTRAINT ride_live_speed_check CHECK(speed_mps IS NULL OR speed_mps BETWEEN 0 AND 100);

CREATE INDEX ride_ondemand_dispatch
  ON ride(campus_id,direction,type,status,search_started_at)
  WHERE dispatch_mode='ON_DEMAND' AND status='OPEN';
