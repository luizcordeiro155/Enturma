CREATE INDEX room_attachment_uploader ON room_attachment(uploaded_by, created_at);
CREATE INDEX room_message_attachment ON room_message(attachment_id) WHERE attachment_id IS NOT NULL;
