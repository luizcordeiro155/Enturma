ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS bio varchar(280),
  ADD COLUMN IF NOT EXISTS accent_color varchar(7) NOT NULL DEFAULT '#183f36',
  ADD COLUMN IF NOT EXISTS avatar_mime varchar(100),
  ADD COLUMN IF NOT EXISTS avatar_bytes bytea,
  ADD COLUMN IF NOT EXISTS banner_mime varchar(100),
  ADD COLUMN IF NOT EXISTS banner_bytes bytea;

ALTER TABLE study_material
  ADD COLUMN IF NOT EXISTS inline_bytes bytea;
