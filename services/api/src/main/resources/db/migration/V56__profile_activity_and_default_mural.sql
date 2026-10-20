-- Explicit existing color choices remain intact; new profiles start with the app surface.
ALTER TABLE profile_showcase ALTER COLUMN mural_mode SET DEFAULT 'DEFAULT';
ALTER TABLE profile_privacy_setting DROP CONSTRAINT profile_privacy_setting_field_check;
ALTER TABLE profile_privacy_setting ADD CONSTRAINT profile_privacy_setting_field_check
  CHECK(field IN ('ACADEMIC','STATS','ACHIEVEMENTS','JOINED','WIDGETS','ACTIVITY'));
CREATE TABLE profile_activity (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES user_session(id) ON DELETE CASCADE,
  kind varchar(16) NOT NULL CHECK(kind IN ('GAME','PRACTICE','NOTEBOOK','ROOM')),
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX profile_activity_recent ON profile_activity(user_id,last_seen_at DESC);
CREATE UNIQUE INDEX profile_activity_active ON profile_activity(user_id,session_id) WHERE ended_at IS NULL;
