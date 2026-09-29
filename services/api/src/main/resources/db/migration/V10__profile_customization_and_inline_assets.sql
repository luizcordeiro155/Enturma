ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS bio varchar(280),
  ADD COLUMN IF NOT EXISTS accent_color varchar(7) NOT NULL DEFAULT '#183f36',
  ADD COLUMN IF NOT EXISTS avatar_mime varchar(100),
  ADD COLUMN IF NOT EXISTS avatar_bytes bytea,
  ADD COLUMN IF NOT EXISTS banner_mime varchar(100),
  ADD COLUMN IF NOT EXISTS banner_bytes bytea;

ALTER TABLE study_material
  ADD COLUMN IF NOT EXISTS inline_bytes bytea;


CREATE TABLE IF NOT EXISTS learning_word_session (
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  level int NOT NULL CHECK(level BETWEEN 1 AND 4),
  puzzle_version varchar(30) NOT NULL,
  attempts int NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  solved_mask int NOT NULL DEFAULT 0 CHECK(solved_mask >= 0),
  completed boolean NOT NULL DEFAULT false,
  guesses text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, level, puzzle_version)
);
