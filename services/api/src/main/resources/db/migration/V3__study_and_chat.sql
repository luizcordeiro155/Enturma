CREATE TABLE study_room (
 id uuid PRIMARY KEY, host_id uuid NOT NULL REFERENCES app_user(id), subject_id uuid NOT NULL REFERENCES academic_entry(id), topic_id uuid REFERENCES academic_entry(id),
 title varchar(150) NOT NULL, status varchar(20) NOT NULL CHECK(status IN ('OPEN','ACTIVE','ENDED','CANCELLED')),
 max_participants int NOT NULL CHECK(max_participants BETWEEN 2 AND 30), created_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz NOT NULL, ended_at timestamptz
);
CREATE INDEX room_matching ON study_room(subject_id,topic_id,status,ends_at);
CREATE TABLE room_participant (
 room_id uuid REFERENCES study_room(id), user_id uuid REFERENCES app_user(id), role varchar(20) NOT NULL CHECK(role IN ('HOST','MODERATOR','MEMBER')),
 joined_at timestamptz NOT NULL DEFAULT now(), left_at timestamptz, removed boolean NOT NULL DEFAULT false, PRIMARY KEY(room_id,user_id)
);
CREATE TABLE chat_message (
 id uuid PRIMARY KEY, room_id uuid NOT NULL REFERENCES study_room(id), user_id uuid NOT NULL REFERENCES app_user(id),
 body varchar(4000) NOT NULL, reply_to uuid REFERENCES chat_message(id), created_at timestamptz NOT NULL DEFAULT now(), edited_at timestamptz, deleted_at timestamptz
);
CREATE INDEX message_room ON chat_message(room_id,created_at,id);
CREATE TABLE user_block (user_id uuid REFERENCES app_user(id), blocked_id uuid REFERENCES app_user(id), PRIMARY KEY(user_id,blocked_id), CHECK(user_id <> blocked_id));
CREATE TABLE report (id uuid PRIMARY KEY, reporter_id uuid NOT NULL REFERENCES app_user(id), target_id uuid NOT NULL REFERENCES app_user(id), reason varchar(2000) NOT NULL, status varchar(20) NOT NULL DEFAULT 'OPEN', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE notification (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), message varchar(500) NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX notification_user ON notification(user_id,created_at);
