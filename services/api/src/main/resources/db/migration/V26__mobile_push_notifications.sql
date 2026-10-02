ALTER TABLE notification_preference
  ADD COLUMN push boolean NOT NULL DEFAULT true;

ALTER TABLE notification_preference
  DROP CONSTRAINT IF EXISTS notification_preference_category_check;

ALTER TABLE notification_preference
  ADD CONSTRAINT notification_preference_category_check
  CHECK(category IN ('ROOM_MESSAGE','MENTION','ROOM_NOTICE','FORUM','ACHIEVEMENT','RIDE','FRIEND'));

CREATE TABLE notification_push_device (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  installation_id varchar(100) NOT NULL,
  token text NOT NULL,
  platform varchar(20) NOT NULL CHECK(platform IN ('ANDROID')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, installation_id),
  UNIQUE(token)
);

CREATE INDEX notification_push_device_user
  ON notification_push_device(user_id)
  WHERE enabled;
