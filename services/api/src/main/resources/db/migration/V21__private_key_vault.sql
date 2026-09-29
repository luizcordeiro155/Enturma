CREATE TABLE private_key_vault (
    user_id uuid PRIMARY KEY REFERENCES private_identity(user_id) ON DELETE CASCADE,
    envelope jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
