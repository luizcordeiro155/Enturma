CREATE TABLE room_message (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  body varchar(4000),
  image_name varchar(255),
  image_mime varchar(80),
  image_size int CHECK(image_size IS NULL OR image_size BETWEEN 0 AND 8388608),
  image_data text,
  reply_to uuid REFERENCES room_message(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK(body IS NOT NULL OR image_data IS NOT NULL OR deleted_at IS NOT NULL)
);
CREATE INDEX room_message_room ON room_message(room_id,created_at,id);

CREATE TABLE room_message_reaction (
  message_id uuid NOT NULL REFERENCES room_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  emoji varchar(16) NOT NULL CHECK(char_length(emoji) BETWEEN 1 AND 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(message_id,user_id,emoji)
);
CREATE INDEX room_message_reaction_message ON room_message_reaction(message_id);

CREATE TABLE room_study_summary (
  room_id uuid PRIMARY KEY REFERENCES study_room(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','PROCESSING','READY','FAILED')),
  content text,
  message_count int NOT NULL DEFAULT 0 CHECK(message_count >= 0),
  last_error varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  generated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX room_study_summary_status ON room_study_summary(status,updated_at);
