-- Enturma Caronas: matching automatico, ciclo de viagem, seguranca e recorrencia.

ALTER TABLE ride
  ADD COLUMN area_lat double precision,
  ADD COLUMN area_lng double precision,
  ADD COLUMN area_accuracy_m int,
  ADD COLUMN trip_status varchar(32) NOT NULL DEFAULT 'MATCHING',
  ADD COLUMN started_at timestamptz,
  ADD COLUMN arrived_at timestamptz,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN recurrence_id uuid;

UPDATE ride
SET trip_status = CASE
  WHEN status='COMPLETED' THEN 'COMPLETED'
  WHEN status='CANCELLED' THEN 'CANCELLED'
  ELSE 'MATCHING'
END,
completed_at = CASE WHEN status='COMPLETED' THEN departure_at ELSE completed_at END;

ALTER TABLE ride
  ADD CONSTRAINT ride_area_lat_check CHECK(area_lat IS NULL OR area_lat BETWEEN -90 AND 90),
  ADD CONSTRAINT ride_area_lng_check CHECK(area_lng IS NULL OR area_lng BETWEEN -180 AND 180),
  ADD CONSTRAINT ride_area_accuracy_check CHECK(area_accuracy_m IS NULL OR area_accuracy_m BETWEEN 0 AND 50000),
  ADD CONSTRAINT ride_trip_status_check CHECK(
    trip_status IN (
      'SCHEDULED','MATCHING','DRIVER_ON_THE_WAY','ARRIVING',
      'WAITING_PASSENGER','IN_PROGRESS','ARRIVED','COMPLETED','CANCELLED'
    )
  );

ALTER TABLE ride_match DROP CONSTRAINT IF EXISTS ride_match_status_check;
ALTER TABLE ride_match DROP CONSTRAINT IF EXISTS ride_match_ride_id_user_id_key;
ALTER TABLE ride_match
  ADD CONSTRAINT ride_match_status_check
    CHECK(status IN ('PENDING','WAITLISTED','ACCEPTED','REJECTED','CANCELLED','NO_SHOW')),
  ADD COLUMN requested_by uuid REFERENCES app_user(id),
  ADD COLUMN request_ride_id uuid REFERENCES ride(id),
  ADD COLUMN driver_id uuid REFERENCES app_user(id),
  ADD COLUMN passenger_id uuid REFERENCES app_user(id),
  ADD COLUMN no_show_user_id uuid REFERENCES app_user(id),
  ADD COLUMN driver_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN passenger_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN boarding_code varchar(4),
  ADD COLUMN boarded_at timestamptz,
  ADD COLUMN pickup_lat double precision,
  ADD COLUMN pickup_lng double precision,
  ADD COLUMN pickup_order int;

UPDATE ride_match m SET
  requested_by=m.user_id,
  driver_id=CASE WHEN r.type='OFFER' THEN r.owner_id ELSE m.user_id END,
  passenger_id=CASE WHEN r.type='OFFER' THEN m.user_id ELSE r.owner_id END
FROM ride r WHERE r.id=m.ride_id;

ALTER TABLE ride_match
  ALTER COLUMN driver_id SET NOT NULL,
  ALTER COLUMN passenger_id SET NOT NULL,
  ADD CONSTRAINT ride_match_boarding_code_check
    CHECK(boarding_code IS NULL OR boarding_code ~ '^[0-9]{4}$'),
  ADD CONSTRAINT ride_match_pickup_lat_check CHECK(pickup_lat IS NULL OR pickup_lat BETWEEN -90 AND 90),
  ADD CONSTRAINT ride_match_pickup_lng_check CHECK(pickup_lng IS NULL OR pickup_lng BETWEEN -180 AND 180),
  ADD CONSTRAINT ride_match_pickup_order_check CHECK(pickup_order IS NULL OR pickup_order BETWEEN 1 AND 8);

ALTER TABLE ride_review
  ADD COLUMN punctuality int,
  ADD COLUMN communication int,
  ADD COLUMN respect int,
  ADD COLUMN responsible boolean,
  ADD COLUMN comment varchar(800);

ALTER TABLE ride_review
  ADD CONSTRAINT ride_review_punctuality_check CHECK(punctuality IS NULL OR punctuality BETWEEN 1 AND 5),
  ADD CONSTRAINT ride_review_communication_check CHECK(communication IS NULL OR communication BETWEEN 1 AND 5),
  ADD CONSTRAINT ride_review_respect_check CHECK(respect IS NULL OR respect BETWEEN 1 AND 5);

CREATE TABLE ride_vehicle_profile (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  brand varchar(60) NOT NULL,
  model varchar(80) NOT NULL,
  color varchar(40) NOT NULL,
  model_year int,
  seats int NOT NULL CHECK(seats BETWEEN 1 AND 8),
  plate_hint varchar(8),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(model_year IS NULL OR model_year BETWEEN 1980 AND 2100),
  CHECK(plate_hint IS NULL OR length(plate_hint) BETWEEN 2 AND 8)
);

CREATE TABLE ride_recurrence (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  campus_id uuid NOT NULL REFERENCES academic_entry(id),
  type varchar(10) NOT NULL CHECK(type IN ('OFFER','REQUEST')),
  origin_area varchar(120) NOT NULL,
  direction varchar(20) NOT NULL CHECK(direction IN ('TO_CAMPUS','FROM_CAMPUS')),
  local_time time NOT NULL,
  timezone varchar(64) NOT NULL DEFAULT 'America/Sao_Paulo',
  weekdays varchar(32) NOT NULL,
  seats int NOT NULL CHECK(seats BETWEEN 1 AND 8),
  area_lat double precision,
  area_lng double precision,
  area_accuracy_m int,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(weekdays ~ '^[1-7](,[1-7])*$'),
  CHECK(area_lat IS NULL OR area_lat BETWEEN -90 AND 90),
  CHECK(area_lng IS NULL OR area_lng BETWEEN -180 AND 180),
  CHECK(area_accuracy_m IS NULL OR area_accuracy_m BETWEEN 0 AND 50000)
);
CREATE INDEX ride_recurrence_owner ON ride_recurrence(owner_id,active);

CREATE TABLE ride_recurrence_instance (
  recurrence_id uuid NOT NULL REFERENCES ride_recurrence(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  ride_id uuid NOT NULL REFERENCES ride(id) ON DELETE CASCADE,
  PRIMARY KEY(recurrence_id,service_date),
  UNIQUE(ride_id)
);
ALTER TABLE ride
  ADD CONSTRAINT ride_recurrence_fk
  FOREIGN KEY(recurrence_id) REFERENCES ride_recurrence(id) ON DELETE SET NULL;

CREATE TABLE campus_pickup_zone (
  id uuid PRIMARY KEY,
  campus_id uuid NOT NULL REFERENCES academic_entry(id),
  name varchar(120) NOT NULL,
  description varchar(300) NOT NULL DEFAULT '',
  lat double precision NOT NULL CHECK(lat BETWEEN -90 AND 90),
  lng double precision NOT NULL CHECK(lng BETWEEN -180 AND 180),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES app_user(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX campus_pickup_zone_campus ON campus_pickup_zone(campus_id,active,name);

CREATE TABLE ride_live_location (
  match_id uuid NOT NULL REFERENCES ride_match(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  lat double precision NOT NULL CHECK(lat BETWEEN -90 AND 90),
  lng double precision NOT NULL CHECK(lng BETWEEN -180 AND 180),
  accuracy_m int NOT NULL DEFAULT 0 CHECK(accuracy_m BETWEEN 0 AND 50000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(match_id,user_id)
);
CREATE INDEX ride_live_location_fresh ON ride_live_location(updated_at);

CREATE TABLE ride_safety_event (
  id uuid PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES ride_match(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  kind varchar(32) NOT NULL CHECK(kind IN ('SHARED','BLOCKED','REPORTED','NO_SHOW','BOARDING_CONFIRMED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ride_safety_event_match ON ride_safety_event(match_id,created_at DESC);

CREATE TABLE ride_safety_share (
  id uuid PRIMARY KEY,
  token uuid NOT NULL UNIQUE,
  match_id uuid NOT NULL REFERENCES ride_match(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ride_safety_share_active ON ride_safety_share(token,expires_at) WHERE revoked_at IS NULL;

CREATE OR REPLACE VIEW ride_reputation_summary AS
SELECT
  reviewee_id,
  count(*)::int reviews,
  round(avg(rating)::numeric,2) rating,
  round(avg(punctuality)::numeric,2) punctuality,
  round(avg(communication)::numeric,2) communication,
  round(avg(respect)::numeric,2) respect,
  count(*) FILTER (WHERE responsible IS TRUE)::int responsible_positive,
  count(responsible)::int responsible_answers
FROM (
  SELECT
    rr.*,
    CASE WHEN rr.reviewer_id=m.passenger_id THEN m.driver_id ELSE m.passenger_id END reviewee_id
  FROM ride_review rr
  JOIN ride_match m ON m.id=rr.match_id
) scored
GROUP BY reviewee_id;

CREATE UNIQUE INDEX ride_match_active_pair
  ON ride_match(ride_id,user_id)
  WHERE status IN ('PENDING','WAITLISTED','ACCEPTED') AND deleted_at IS NULL;

CREATE INDEX ride_match_waitlist_idx
  ON ride_match(ride_id,created_at)
  WHERE status='WAITLISTED' AND deleted_at IS NULL;
CREATE INDEX ride_match_confirmation_idx
  ON ride_match(ride_id,status,driver_confirmed,passenger_confirmed)
  WHERE deleted_at IS NULL;
CREATE INDEX ride_geo_time_idx
  ON ride(campus_id,direction,type,status,departure_at);
