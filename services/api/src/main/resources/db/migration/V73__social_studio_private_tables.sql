-- Match V62/V69 default-deny policy for tables added by the Studio and collections.
-- The trusted API owner continues to authorize each actor; no FORCE RLS or data rewrite.
REVOKE ALL ON TABLE social_live, social_comment_media, social_comment_like,
  social_collection, social_collection_item FROM PUBLIC;
ALTER TABLE social_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comment_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comment_like ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_collection_item ENABLE ROW LEVEL SECURITY;
