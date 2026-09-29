-- Persistent collaborative study rooms, accessibility preferences and advanced learning games.
-- Additive migration: no existing user or academic data is removed.

CREATE TABLE room_attachment (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES app_user(id),
  file_name varchar(200) NOT NULL,
  storage_key varchar(260) NOT NULL UNIQUE,
  mime_type varchar(100) NOT NULL,
  file_size bigint NOT NULL CHECK(file_size > 0 AND file_size <= 8388608),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_attachment_room ON room_attachment(room_id, created_at DESC);

CREATE TABLE room_message (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id),
  body varchar(4000),
  reply_to uuid REFERENCES room_message(id),
  attachment_id uuid REFERENCES room_attachment(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  search tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(body, ''))) STORED,
  CHECK(body IS NOT NULL OR attachment_id IS NOT NULL)
);
CREATE INDEX room_message_room ON room_message(room_id, created_at DESC, id DESC);
CREATE INDEX room_message_search ON room_message USING gin(search);

CREATE TABLE room_reaction (
  message_id uuid NOT NULL REFERENCES room_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  emoji varchar(16) NOT NULL CHECK(char_length(emoji) BETWEEN 1 AND 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(message_id, user_id, emoji)
);
CREATE INDEX room_reaction_message ON room_reaction(message_id);

CREATE TABLE room_memory_checkpoint (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  summary text NOT NULL,
  through_created_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  search tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', summary)) STORED
);
CREATE INDEX room_memory_room ON room_memory_checkpoint(room_id, created_at DESC);
CREATE INDEX room_memory_search ON room_memory_checkpoint USING gin(search);

CREATE TABLE room_session_artifact (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  kind varchar(40) NOT NULL,
  title varchar(180) NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_artifact_room ON room_session_artifact(room_id, created_at DESC);
CREATE INDEX room_artifact_kind ON room_session_artifact(room_id, kind, created_at DESC);

CREATE TABLE user_experience_preference (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  theme varchar(12) NOT NULL DEFAULT 'SYSTEM' CHECK(theme IN ('LIGHT','DARK','SYSTEM')),
  font_scale numeric(3,2) NOT NULL DEFAULT 1.00 CHECK(font_scale BETWEEN 0.85 AND 1.35),
  high_contrast boolean NOT NULL DEFAULT false,
  reduced_motion boolean NOT NULL DEFAULT false,
  enhanced_focus boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE word_game_result (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  challenge_key varchar(180) NOT NULL,
  mode varchar(12) NOT NULL CHECK(mode IN ('SOLO','DUET','QUARTET')),
  difficulty int NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
  attempts int NOT NULL CHECK(attempts BETWEEN 1 AND 20),
  won boolean NOT NULL,
  daily boolean NOT NULL DEFAULT false,
  duration_ms int NOT NULL DEFAULT 0 CHECK(duration_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_key)
);
CREATE INDEX word_result_user ON word_game_result(user_id, created_at DESC);

CREATE TABLE daily_word_progress (
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  challenge_date date NOT NULL,
  mode varchar(12) NOT NULL CHECK(mode IN ('SOLO','DUET','QUARTET')),
  difficulty int NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
  attempts int NOT NULL DEFAULT 0 CHECK(attempts >= 0),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY(user_id, challenge_date, mode)
);

CREATE TABLE algorithm_game_result (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  level int NOT NULL CHECK(level BETWEEN 1 AND 6),
  command_count int NOT NULL CHECK(command_count BETWEEN 1 AND 1000),
  attempts int NOT NULL DEFAULT 1 CHECK(attempts >= 1),
  duration_ms int NOT NULL DEFAULT 0 CHECK(duration_ms >= 0),
  stars int NOT NULL CHECK(stars BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX algorithm_result_user ON algorithm_game_result(user_id, created_at DESC);

ALTER TABLE learning_progress DROP CONSTRAINT IF EXISTS learning_progress_level_check;
ALTER TABLE learning_progress ADD CONSTRAINT learning_progress_level_check CHECK(level BETWEEN 1 AND 6);
ALTER TABLE daily_learning_progress DROP CONSTRAINT IF EXISTS daily_learning_progress_level_check;
ALTER TABLE daily_learning_progress ADD CONSTRAINT daily_learning_progress_level_check CHECK(level BETWEEN 1 AND 6);
