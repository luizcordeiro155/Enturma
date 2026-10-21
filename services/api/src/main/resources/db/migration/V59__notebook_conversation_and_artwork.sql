ALTER TABLE study_notebook ADD COLUMN has_avatar boolean NOT NULL DEFAULT false;
ALTER TABLE study_notebook ADD COLUMN has_banner boolean NOT NULL DEFAULT false;
ALTER TABLE study_notebook ADD COLUMN media_version integer NOT NULL DEFAULT 0;
CREATE TABLE notebook_media (
 notebook_id uuid NOT NULL REFERENCES study_notebook(id) ON DELETE CASCADE,
 kind varchar(8) NOT NULL CHECK(kind IN ('avatar','banner')),
 mime varchar(32) NOT NULL, data bytea NOT NULL CHECK(octet_length(data)<=3145728),
 PRIMARY KEY(notebook_id,kind)
);
ALTER TABLE notebook_generation ADD COLUMN web_search boolean NOT NULL DEFAULT false;
ALTER TABLE notebook_generation ADD COLUMN external_sources jsonb NOT NULL DEFAULT '[]';
