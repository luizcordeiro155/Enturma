-- Expand only: legacy saved posts and old clients continue working unchanged.
CREATE TABLE social_collection (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name varchar(60) NOT NULL CHECK (length(trim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX social_collection_owner ON social_collection(owner_id, created_at, id);
CREATE TABLE social_collection_item (
  collection_id uuid NOT NULL REFERENCES social_collection(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES social_post(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, post_id)
);
CREATE INDEX social_collection_item_post ON social_collection_item(post_id);
