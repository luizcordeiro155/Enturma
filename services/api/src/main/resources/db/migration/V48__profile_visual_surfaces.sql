ALTER TABLE profile_showcase
  ADD COLUMN mural_mode varchar(16) NOT NULL DEFAULT 'PROFILE' CHECK (mural_mode IN ('PROFILE','DEFAULT','CUSTOM')),
  ADD COLUMN mural_color varchar(7) NOT NULL DEFAULT '#18243d' CHECK (mural_color ~ '^#[0-9a-fA-F]{6}$'),
  ADD COLUMN mural_secondary_color varchar(7) NOT NULL DEFAULT '#661245' CHECK (mural_secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  ADD COLUMN gradient_angle integer NOT NULL DEFAULT 155 CHECK (gradient_angle BETWEEN 0 AND 360),
  ADD COLUMN gradient_flow varchar(8) NOT NULL DEFAULT 'STILL' CHECK (gradient_flow IN ('STILL','FLOW')),
  ADD COLUMN entrance varchar(8) NOT NULL DEFAULT 'RISE' CHECK (entrance IN ('NONE','RISE','BOOK','ORBIT'));
