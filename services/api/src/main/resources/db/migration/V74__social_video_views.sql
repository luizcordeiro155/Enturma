-- One qualified viewer per video publication, independent of recommendation consent.
CREATE TABLE social_video_view (
 post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(post_id,user_id)
);
REVOKE ALL ON TABLE social_video_view FROM PUBLIC;
ALTER TABLE social_video_view ENABLE ROW LEVEL SECURITY;
