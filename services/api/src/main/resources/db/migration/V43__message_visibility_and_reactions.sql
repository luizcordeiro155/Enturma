CREATE TABLE room_message_hidden (
  message_id uuid NOT NULL REFERENCES room_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX room_message_hidden_user ON room_message_hidden(user_id, message_id);

ALTER TABLE private_message ADD COLUMN deleted_at timestamptz;
ALTER TABLE private_message ADD COLUMN edited_at timestamptz;
CREATE TABLE private_message_hidden (
  message_id uuid NOT NULL REFERENCES private_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX private_message_hidden_user ON private_message_hidden(user_id, message_id);

CREATE TABLE private_message_reaction (
  message_id uuid NOT NULL REFERENCES private_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  emoji varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
ALTER TABLE room_reaction ALTER COLUMN emoji TYPE varchar(64);
ALTER TABLE forum_reaction ALTER COLUMN emoji TYPE varchar(64);
