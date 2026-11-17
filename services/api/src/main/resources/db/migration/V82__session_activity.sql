-- Where each login runs (web, desktop app, Android app) and when it was last used.
ALTER TABLE user_session
  ADD COLUMN platform varchar(16) CHECK (platform IN ('WEB', 'DESKTOP', 'ANDROID')),
  ADD COLUMN client_name varchar(60),
  ADD COLUMN last_seen_at timestamptz;
-- Existing sessions keep last_seen_at empty until they are used again; new ones start now.
ALTER TABLE user_session ALTER COLUMN last_seen_at SET DEFAULT now();
