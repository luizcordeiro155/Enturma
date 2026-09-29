CREATE TABLE forum_entry (
 id uuid PRIMARY KEY, author_id uuid NOT NULL REFERENCES app_user(id),
 root_id uuid REFERENCES forum_entry(id) ON DELETE CASCADE,
 parent_id uuid REFERENCES forum_entry(id) ON DELETE CASCADE,
 title varchar(180), body varchar(12000) NOT NULL,
 category varchar(30) NOT NULL CHECK(category IN ('GENERAL','PROGRAMMING','ACADEMIC','CAREER','CAMPUS')),
 depth int NOT NULL DEFAULT 0 CHECK(depth BETWEEN 0 AND 4), deleted boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 search_vector tsvector GENERATED ALWAYS AS (to_tsvector('portuguese',coalesce(title,'') || ' ' || body)) STORED,
 CHECK((root_id IS NULL AND parent_id IS NULL AND title IS NOT NULL AND depth=0) OR (root_id IS NOT NULL AND parent_id IS NOT NULL AND title IS NULL AND depth>0))
);
CREATE INDEX forum_feed ON forum_entry(created_at DESC,id) WHERE root_id IS NULL;
CREATE INDEX forum_thread ON forum_entry(root_id,created_at,id);
CREATE INDEX forum_search ON forum_entry USING gin(search_vector);
CREATE TABLE forum_vote(entry_id uuid NOT NULL REFERENCES forum_entry(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES app_user(id),value smallint NOT NULL CHECK(value IN (-1,1)),PRIMARY KEY(entry_id,user_id));
CREATE TABLE forum_reaction(entry_id uuid NOT NULL REFERENCES forum_entry(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES app_user(id),emoji varchar(20) NOT NULL,PRIMARY KEY(entry_id,user_id));
