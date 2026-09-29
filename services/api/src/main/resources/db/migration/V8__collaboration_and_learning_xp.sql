CREATE TABLE chat_reaction (
 message_id uuid NOT NULL REFERENCES chat_message(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 emoji varchar(16) NOT NULL CHECK(char_length(emoji) BETWEEN 1 AND 16),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(message_id,user_id,emoji)
);
CREATE INDEX chat_reaction_message ON chat_reaction(message_id);

CREATE TABLE learning_stats (
 user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
 total_xp int NOT NULL DEFAULT 0 CHECK(total_xp >= 0),
 current_streak int NOT NULL DEFAULT 0 CHECK(current_streak >= 0),
 longest_streak int NOT NULL DEFAULT 0 CHECK(longest_streak >= 0),
 last_active_date date,
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE learning_xp_event (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 event_key varchar(160) NOT NULL,
 amount int NOT NULL CHECK(amount BETWEEN 1 AND 500),
 reason varchar(80) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,event_key)
);
CREATE INDEX learning_xp_user ON learning_xp_event(user_id,created_at DESC);

CREATE TABLE daily_learning_progress (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 challenge_date date NOT NULL,
 game varchar(30) NOT NULL,
 level int NOT NULL CHECK(level BETWEEN 1 AND 4),
 attempts int NOT NULL DEFAULT 0 CHECK(attempts >= 0),
 completed boolean NOT NULL DEFAULT false,
 completed_at timestamptz,
 PRIMARY KEY(user_id,challenge_date)
);
