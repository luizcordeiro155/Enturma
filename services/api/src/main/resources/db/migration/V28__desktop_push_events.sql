CREATE TABLE notification_desktop_push_event (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  category varchar(40) NOT NULL,
  kind varchar(60) NOT NULL,
  target_id uuid,
  href text,
  message text NOT NULL,
  dedupe_key varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id,dedupe_key)
);

CREATE INDEX notification_desktop_push_event_user_sequence
  ON notification_desktop_push_event(user_id,sequence);
