-- Additive: v2/v3 vaults and all message identities remain intact during migration.
CREATE TABLE private_account_session_key (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  sealed_key text NOT NULL,
  envelope jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz
);
ALTER TABLE private_account_session_key ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private_account_session_key FROM PUBLIC;
