ALTER TABLE app_user ADD COLUMN credential_version integer NOT NULL DEFAULT 1;
CREATE TABLE private_account_vault (
  user_id uuid PRIMARY KEY REFERENCES private_identity(user_id) ON DELETE CASCADE,
  credential_version integer NOT NULL CHECK(credential_version>0),
  envelope jsonb NOT NULL CHECK(envelope->>'version'='3'),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
-- Keep the original separately encrypted vault as a migration/recovery path.
-- Neither vault stores a plaintext private key or a decryption key on the server.
