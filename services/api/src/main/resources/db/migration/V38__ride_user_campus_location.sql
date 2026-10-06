-- Allow each student to confirm a campus point when the academic catalog has no coordinates.
ALTER TABLE ride_user_mobility_pref
  ADD COLUMN campus_label_override varchar(240),
  ADD COLUMN campus_lat_override double precision,
  ADD COLUMN campus_lng_override double precision;

ALTER TABLE ride_user_mobility_pref
  ADD CONSTRAINT ride_pref_campus_override_pair_check CHECK (
    (campus_lat_override IS NULL AND campus_lng_override IS NULL)
    OR
    (campus_lat_override IS NOT NULL AND campus_lng_override IS NOT NULL)
  ),
  ADD CONSTRAINT ride_pref_campus_lat_override_check
    CHECK(campus_lat_override IS NULL OR campus_lat_override BETWEEN -90 AND 90),
  ADD CONSTRAINT ride_pref_campus_lng_override_check
    CHECK(campus_lng_override IS NULL OR campus_lng_override BETWEEN -180 AND 180);
