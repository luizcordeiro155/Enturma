-- New profile customizations use Enturma's system mural. Existing choices remain intact.
ALTER TABLE profile_showcase ALTER COLUMN mural_mode SET DEFAULT 'DEFAULT';
