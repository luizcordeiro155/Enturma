-- Recipients are fixed when sending. Old messages deliberately retain unknown delivery state.
ALTER TABLE room_message ADD COLUMN client_id uuid;
CREATE UNIQUE INDEX room_message_sender_client ON room_message(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE TABLE private_message_receipt (
  message_id uuid NOT NULL REFERENCES private_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  PRIMARY KEY (message_id, user_id),
  CHECK (read_at IS NULL OR (delivered_at IS NOT NULL AND read_at >= delivered_at))
);
CREATE TABLE room_message_receipt (
  message_id uuid NOT NULL REFERENCES room_message(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  PRIMARY KEY (message_id, user_id),
  CHECK (read_at IS NULL OR (delivered_at IS NOT NULL AND read_at >= delivered_at))
);
CREATE INDEX private_receipt_recipient ON private_message_receipt(user_id, message_id);
CREATE INDEX room_receipt_recipient ON room_message_receipt(user_id, message_id);
ALTER TABLE private_message_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_message_receipt ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private_message_receipt, room_message_receipt FROM PUBLIC;
