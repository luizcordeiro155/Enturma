-- Keep authorized study history and support installations without object storage.
ALTER TABLE room_attachment ADD COLUMN inline_bytes bytea;
ALTER TABLE room_message DROP CONSTRAINT room_message_check;
ALTER TABLE room_message ADD CONSTRAINT room_message_content CHECK(body IS NOT NULL OR attachment_id IS NOT NULL OR deleted_at IS NOT NULL);
CREATE TABLE ride_voice(match_id uuid PRIMARY KEY REFERENCES ride_match(id), updated_at timestamptz NOT NULL DEFAULT now(), cleaned boolean NOT NULL DEFAULT false);

CREATE TABLE word_game_session (
 user_id uuid NOT NULL REFERENCES app_user(id), challenge_key varchar(120) NOT NULL,
 mode varchar(12) NOT NULL, difficulty integer NOT NULL, daily boolean NOT NULL,
 guesses text[] NOT NULL DEFAULT '{}', finished boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,challenge_key)
);
