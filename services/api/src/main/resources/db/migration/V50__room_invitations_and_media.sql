-- Retain every participant; only new ordinary entries use the new capacities.
ALTER TABLE study_room DROP CONSTRAINT study_room_max_participants_check;
UPDATE study_room SET max_participants=10 WHERE lifecycle='QUICK' AND max_participants>10;
ALTER TABLE study_room ADD CONSTRAINT study_room_capacity_check
  CHECK(max_participants BETWEEN 2 AND CASE WHEN lifecycle='MULTIDAY' THEN 45 ELSE 10 END);
ALTER TABLE study_room ADD COLUMN has_avatar boolean NOT NULL DEFAULT false;
ALTER TABLE study_room ADD COLUMN has_banner boolean NOT NULL DEFAULT false;
ALTER TABLE study_room ADD COLUMN media_version bigint NOT NULL DEFAULT 0;
CREATE TABLE room_media (
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  kind varchar(8) NOT NULL CHECK(kind IN ('avatar','banner')),
  mime varchar(32) NOT NULL CHECK(mime IN ('image/png','image/jpeg','image/webp','image/gif')),
  data bytea NOT NULL CHECK(octet_length(data) BETWEEN 12 AND 3145728),
  PRIMARY KEY(room_id,kind)
);
