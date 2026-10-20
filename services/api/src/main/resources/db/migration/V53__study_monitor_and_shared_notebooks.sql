CREATE TABLE room_monitor_turn (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  trigger_id uuid NOT NULL REFERENCES room_message(id) ON DELETE CASCADE,
  kind varchar(12) NOT NULL CHECK(kind IN ('MENTION','IDLE','MATERIAL')),
  status varchar(12) NOT NULL DEFAULT 'RUNNING' CHECK(status IN ('RUNNING','SENT','FAILED','SKIPPED')),
  created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
  UNIQUE(room_id,trigger_id,kind)
);
CREATE INDEX monitor_room_recent ON room_monitor_turn(room_id,created_at DESC);
CREATE UNIQUE INDEX monitor_one_running ON room_monitor_turn(room_id) WHERE status='RUNNING';
ALTER TABLE room_system_event ALTER COLUMN message TYPE varchar(6000);
CREATE TABLE room_notebook_share (
  room_id uuid NOT NULL REFERENCES study_room(id) ON DELETE CASCADE,
  notebook_id uuid NOT NULL REFERENCES study_notebook(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(room_id,notebook_id)
);
CREATE TABLE room_image_description (
  attachment_id uuid PRIMARY KEY REFERENCES room_attachment(id) ON DELETE CASCADE,
  description varchar(8000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
