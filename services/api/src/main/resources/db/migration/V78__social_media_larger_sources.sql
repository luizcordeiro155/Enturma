-- 3-minute phone videos: originals up to 512 MiB (was 128 MiB).
-- The per-account media quota is removed in the API; nothing here limits it.
ALTER TABLE social_media DROP CONSTRAINT IF EXISTS social_media_expected_bytes_check;
ALTER TABLE social_media
  ADD CONSTRAINT social_media_expected_bytes_check
  CHECK (expected_bytes BETWEEN 1 AND 536870912);
