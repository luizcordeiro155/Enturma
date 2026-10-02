CREATE TABLE moderation_review_queue (
 message_id uuid PRIMARY KEY REFERENCES room_message(id) ON DELETE CASCADE,
 available_at timestamptz NOT NULL DEFAULT now(),
 attempts int NOT NULL DEFAULT 0,
 completed_at timestamptz
);
CREATE INDEX moderation_review_pending ON moderation_review_queue(available_at) WHERE completed_at IS NULL;
CREATE FUNCTION enqueue_public_message_review() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO moderation_review_queue(message_id) VALUES(NEW.id)
 ON CONFLICT(message_id) DO UPDATE SET available_at=now(),attempts=0,completed_at=NULL;
 RETURN NEW;
END $$;
CREATE TRIGGER review_public_message AFTER INSERT OR UPDATE OF body ON room_message
 FOR EACH ROW EXECUTE FUNCTION enqueue_public_message_review();
