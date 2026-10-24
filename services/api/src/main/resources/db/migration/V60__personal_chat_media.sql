-- Private, bounded media library. Ownership is checked on every API operation.
CREATE TABLE chat_media (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  kind varchar(8) NOT NULL CHECK (kind IN ('STICKER','GIF')),
  mime varchar(32) NOT NULL CHECK (mime IN ('image/png','image/jpeg','image/webp','image/gif')),
  data bytea NOT NULL CHECK (octet_length(data) BETWEEN 1 AND 1433600),
  digest varchar(64) NOT NULL,
  favorite boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, digest, kind)
);
CREATE INDEX chat_media_owner ON chat_media(user_id, created_at DESC);
REVOKE ALL ON chat_media FROM PUBLIC;
