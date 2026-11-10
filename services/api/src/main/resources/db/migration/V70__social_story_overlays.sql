ALTER TABLE social_post ADD COLUMN story_overlays jsonb NOT NULL DEFAULT '[]';
ALTER TABLE social_post ADD CONSTRAINT social_story_overlays_array CHECK(jsonb_typeof(story_overlays)='array');
