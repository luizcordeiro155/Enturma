-- Additive Social Studio release. Existing posts, media and encrypted chats are unchanged.
CREATE TABLE social_live (
 id uuid PRIMARY KEY,
 author_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 title varchar(120) NOT NULL,
 visibility varchar(16) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC','FOLLOWERS')),
 state varchar(16) NOT NULL DEFAULT 'STARTING' CHECK (state IN ('STARTING','LIVE','ENDED')),
 started_at timestamptz NOT NULL DEFAULT now(),
 last_host_seen timestamptz NOT NULL DEFAULT now(),
 ended_at timestamptz,
 viewers integer NOT NULL DEFAULT 0 CHECK (viewers>=0),
 peak_viewers integer NOT NULL DEFAULT 0 CHECK (peak_viewers>=0),
 cleanup_pending boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX social_live_one_host ON social_live(author_id) WHERE state IN ('STARTING','LIVE');
CREATE INDEX social_live_active ON social_live(state,started_at DESC);
CREATE TABLE social_comment_media (
 id uuid PRIMARY KEY,
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 mime varchar(32) NOT NULL CHECK (mime IN ('image/jpeg','image/png','image/gif','image/webp')),
 data bytea NOT NULL CHECK (octet_length(data)>0 AND octet_length(data)<=1433600),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX social_comment_media_owner ON social_comment_media(owner_id);
ALTER TABLE social_comment ADD COLUMN media_id uuid REFERENCES social_comment_media(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX social_comment_media_once ON social_comment(media_id) WHERE media_id IS NOT NULL;
CREATE TABLE social_comment_like (
 comment_id uuid NOT NULL REFERENCES social_comment(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(comment_id,user_id)
);
