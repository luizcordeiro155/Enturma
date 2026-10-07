CREATE TABLE room_voice_presence (
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL,
  microphone boolean NOT NULL DEFAULT false,
  camera boolean NOT NULL DEFAULT false,
  screen boolean NOT NULL DEFAULT false,
  deafened boolean NOT NULL DEFAULT false,
  connected boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_event_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id,user_id)
);
