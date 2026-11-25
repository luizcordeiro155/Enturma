-- Sign-in with Google and the GitHub account a student connects to the portfolio.
-- Only who the person is at the provider is kept; no provider token is stored.
CREATE TABLE user_identity (
  provider varchar(10) NOT NULL CHECK (provider IN ('GOOGLE', 'GITHUB')),
  subject varchar(255) NOT NULL,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  login varchar(254) NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, subject),
  UNIQUE (user_id, provider)
);

-- False for an account that only ever signed in with Google.
ALTER TABLE app_user ADD COLUMN password_set boolean NOT NULL DEFAULT true;

ALTER TABLE portfolio_profile
  ADD COLUMN github_auto boolean NOT NULL DEFAULT false,
  ADD COLUMN github_synced_at timestamptz,
  -- repositories already brought once, so a project the student removed does not come back
  ADD COLUMN github_seen text[] NOT NULL DEFAULT '{}';
