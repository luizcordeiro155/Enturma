-- Independent social domain. Existing forum, friendship and academic data are unchanged.
ALTER TABLE notification_preference DROP CONSTRAINT notification_preference_category_check;
ALTER TABLE notification_preference ADD CONSTRAINT notification_preference_category_check CHECK (category IN ('ROOM_MESSAGE','PRIVATE_MESSAGE','MENTION','ROOM_NOTICE','FORUM','ACHIEVEMENT','RIDE','FRIEND','SOCIAL_CONTENT','SOCIAL_RELATIONSHIP','SOCIAL_INTERACTION','SOCIAL_VERIFICATION'));

CREATE TABLE social_profile (
 user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
 private_account boolean NOT NULL DEFAULT false,
 recommendations boolean NOT NULL DEFAULT false,
 autoplay boolean NOT NULL DEFAULT true,
 interests text[] NOT NULL DEFAULT '{}',
 navigation jsonb NOT NULL DEFAULT '{"automatic":false,"order":["feed","clips","create"]}',
 verified boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE social_follow (
 follower_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 followed_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 status varchar(12) NOT NULL CHECK(status IN ('PENDING','ACCEPTED')),
 notify boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(follower_id,followed_id), CHECK(follower_id<>followed_id)
);
CREATE INDEX social_follow_incoming ON social_follow(followed_id,status,created_at DESC,follower_id);
CREATE TABLE social_mute (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 creator_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,creator_id), CHECK(user_id<>creator_id)
);
CREATE TABLE social_post (
 id uuid PRIMARY KEY, author_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 kind varchar(8) NOT NULL CHECK(kind IN ('POST','CLIP','STORY')),
 state varchar(12) NOT NULL DEFAULT 'DRAFT' CHECK(state IN ('DRAFT','PUBLISHED','REMOVED')),
 visibility varchar(12) NOT NULL DEFAULT 'PUBLIC' CHECK(visibility IN ('PUBLIC','FOLLOWERS')),
 body varchar(4000) NOT NULL DEFAULT '', tags text[] NOT NULL DEFAULT '{}',
 project_url varchar(500), institution_id uuid REFERENCES academic_institution(id),
 version int NOT NULL DEFAULT 1, pinned boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz, expires_at timestamptz,
 CHECK(state<>'PUBLISHED' OR published_at IS NOT NULL),
 CHECK(kind<>'STORY' OR state<>'PUBLISHED' OR expires_at IS NOT NULL)
);
CREATE INDEX social_feed_cursor ON social_post(published_at DESC,id DESC) WHERE state='PUBLISHED';
CREATE INDEX social_author_cursor ON social_post(author_id,published_at DESC,id DESC);
CREATE INDEX social_campus_cursor ON social_post(institution_id,published_at DESC,id DESC) WHERE state='PUBLISHED';
CREATE INDEX social_post_tags ON social_post USING gin(tags);
CREATE INDEX social_post_search ON social_post USING gin(to_tsvector('portuguese',body));
CREATE TABLE social_reaction (
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 kind varchar(8) NOT NULL CHECK(kind IN ('LIKE','SAVE','REPOST','HIDE')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(post_id,user_id,kind)
);
CREATE INDEX social_user_reactions ON social_reaction(user_id,kind,created_at DESC,post_id);
CREATE TABLE social_comment (
 id uuid PRIMARY KEY, post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 parent_id uuid REFERENCES social_comment(id), body varchar(1500) NOT NULL,
 deleted boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(author_id,id)
);
CREATE INDEX social_comment_cursor ON social_comment(post_id,created_at,id);
CREATE TABLE social_mention (
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 approved boolean NOT NULL DEFAULT false, PRIMARY KEY(post_id,user_id)
);
CREATE TABLE social_story_view (
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(post_id,user_id)
);
CREATE TABLE social_highlight (
 post_id uuid PRIMARY KEY REFERENCES social_post(id) ON DELETE CASCADE,
 title varchar(60) NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE social_feedback (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 watched_ms int NOT NULL CHECK(watched_ms BETWEEN 0 AND 90000),
 completed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,post_id)
);
CREATE TABLE social_report (
 id uuid PRIMARY KEY, reporter_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 reason varchar(1500) NOT NULL, status varchar(12) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','DISMISSED','REMOVED')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_by uuid REFERENCES app_user(id), decision varchar(1500),
 UNIQUE(reporter_id,post_id)
);
CREATE TABLE social_verification (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 reason varchar(1500) NOT NULL, status varchar(12) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','REVOKED')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz, reviewer_id uuid REFERENCES app_user(id), decision varchar(1500)
);
CREATE UNIQUE INDEX social_verification_pending ON social_verification(user_id) WHERE status='PENDING';
CREATE TABLE social_media (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES app_user(id),
 post_id uuid REFERENCES social_post(id) ON DELETE SET NULL,
 kind varchar(8) NOT NULL CHECK(kind IN ('IMAGE','VIDEO')),
 state varchar(12) NOT NULL DEFAULT 'UPLOADING' CHECK(state IN ('UPLOADING','QUEUED','PROCESSING','READY','FAILED','DELETING')),
 expected_bytes bigint NOT NULL CHECK(expected_bytes BETWEEN 1 AND 134217728),
 received_bytes bigint NOT NULL DEFAULT 0, part_count int NOT NULL DEFAULT 0,
 recipe jsonb NOT NULL DEFAULT '{}', output_key varchar(200), thumbnail_key varchar(200),
 duration_ms int, width int, height int, mime varchar(60), output_bytes bigint, thumbnail_bytes bigint, error varchar(300),
 lease_until timestamptz, attempts int NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 ordinal int NOT NULL DEFAULT 0
);
CREATE INDEX social_media_job ON social_media(state,created_at);
CREATE INDEX social_media_post ON social_media(post_id,ordinal);
CREATE TABLE social_media_part (
 media_id uuid NOT NULL REFERENCES social_media(id) ON DELETE CASCADE,
 ordinal int NOT NULL CHECK(ordinal BETWEEN 0 AND 63), size int NOT NULL CHECK(size BETWEEN 1 AND 2097152),
 sha256 char(64) NOT NULL, PRIMARY KEY(media_id,ordinal)
);
CREATE TABLE social_fanout (
 post_id uuid PRIMARY KEY REFERENCES social_post(id) ON DELETE CASCADE,
 after_user uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000', created_at timestamptz NOT NULL DEFAULT now()
);
-- Match the existing default-deny direct database policy; the Java owner still checks every actor.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname=current_schema() AND tablename LIKE 'social\_%' ESCAPE '\'
 LOOP
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',t.tablename);
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t.tablename);
 END LOOP;
END $$;
