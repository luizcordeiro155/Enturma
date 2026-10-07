ALTER TABLE private_message
  ADD COLUMN attachment_ciphertext text,
  ADD COLUMN attachment_iv varchar(24),
  ADD COLUMN attachment_mime varchar(64),
  ADD COLUMN attachment_name varchar(200),
  ADD COLUMN attachment_size integer;

ALTER TABLE private_message
  ADD CONSTRAINT private_message_attachment_consistency CHECK (
    (attachment_ciphertext IS NULL
      AND attachment_iv IS NULL
      AND attachment_mime IS NULL
      AND attachment_name IS NULL
      AND attachment_size IS NULL)
    OR
    (attachment_ciphertext IS NOT NULL
      AND attachment_iv IS NOT NULL
      AND attachment_mime IS NOT NULL
      AND attachment_name IS NOT NULL
      AND attachment_size BETWEEN 1 AND 1433600)
  );
