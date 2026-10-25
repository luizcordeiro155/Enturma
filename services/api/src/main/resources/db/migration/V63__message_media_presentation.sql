-- Existing messages remain regular attachments. Only new explicit selections carry a kind.
ALTER TABLE room_message ADD COLUMN media_kind varchar(8)
  CHECK (media_kind IS NULL OR (media_kind IN ('STICKER','GIF') AND attachment_id IS NOT NULL));
ALTER TABLE private_message ADD COLUMN media_kind varchar(8)
  CHECK (media_kind IS NULL OR (media_kind IN ('STICKER','GIF') AND attachment_ciphertext IS NOT NULL));
