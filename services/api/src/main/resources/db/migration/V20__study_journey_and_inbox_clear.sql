ALTER TABLE notification ADD COLUMN dismissed_at timestamptz;
CREATE TABLE study_journey (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  tutorial_seen_at timestamptz
);
