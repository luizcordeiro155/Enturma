ALTER TABLE notification ADD COLUMN kind varchar(30) NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE notification ADD COLUMN actor_id uuid REFERENCES app_user(id);
ALTER TABLE notification ADD COLUMN context_key varchar(100);
ALTER TABLE notification ADD COLUMN target_id uuid;
ALTER TABLE notification ADD COLUMN href varchar(250);
ALTER TABLE notification ADD COLUMN dedupe_key varchar(200);
CREATE UNIQUE INDEX notification_dedupe ON notification(user_id,dedupe_key);
CREATE INDEX notification_unread ON notification(user_id,created_at DESC) WHERE read_at IS NULL;
CREATE INDEX notification_context ON notification(user_id,context_key) WHERE read_at IS NULL;
