-- Media revision makes new avatar/banner bytes visible immediately on every client.
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS media_version bigint NOT NULL DEFAULT 0;
