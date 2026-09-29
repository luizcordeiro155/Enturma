CREATE TABLE ride (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_user(id), campus_id uuid NOT NULL REFERENCES academic_entry(id),
 type varchar(10) NOT NULL CHECK(type IN ('OFFER','REQUEST')), origin_area varchar(120) NOT NULL,
 direction varchar(20) NOT NULL CHECK(direction IN ('TO_CAMPUS','FROM_CAMPUS')), departure_at timestamptz NOT NULL,
 seats int NOT NULL CHECK(seats BETWEEN 1 AND 8), status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','COMPLETED','CANCELLED')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ride_search ON ride(campus_id,status,departure_at);
CREATE TABLE ride_match (
 id uuid PRIMARY KEY, ride_id uuid NOT NULL REFERENCES ride(id), user_id uuid NOT NULL REFERENCES app_user(id),
 status varchar(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED')),
 meeting_point varchar(500), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(ride_id,user_id)
);
CREATE TABLE ride_message (id uuid PRIMARY KEY, match_id uuid NOT NULL REFERENCES ride_match(id), sender_id uuid NOT NULL REFERENCES app_user(id), body varchar(2000) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ride_chat ON ride_message(match_id,created_at);
CREATE TABLE ride_review (match_id uuid REFERENCES ride_match(id), reviewer_id uuid REFERENCES app_user(id), rating int NOT NULL CHECK(rating BETWEEN 1 AND 5), PRIMARY KEY(match_id,reviewer_id));
