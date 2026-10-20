CREATE TABLE private_typing_presence (
  friendship_id uuid NOT NULL REFERENCES friendship(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(friendship_id,user_id)
);
CREATE INDEX private_typing_expiry ON private_typing_presence(expires_at);
