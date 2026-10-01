CREATE TABLE password_reset_flow (
  id uuid PRIMARY KEY,
  tracking_hash varchar(64) UNIQUE NOT NULL,
  user_id uuid REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_reset_flow_user
  ON password_reset_flow(user_id, expires_at DESC);

CREATE INDEX idx_password_reset_flow_expiry
  ON password_reset_flow(expires_at);
