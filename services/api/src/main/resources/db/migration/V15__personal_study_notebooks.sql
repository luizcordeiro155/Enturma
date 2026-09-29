CREATE TABLE study_notebook (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 title varchar(120) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX study_notebook_owner ON study_notebook(user_id, updated_at DESC);
CREATE TABLE notebook_source (
 id uuid PRIMARY KEY, notebook_id uuid NOT NULL REFERENCES study_notebook(id) ON DELETE CASCADE,
 title varchar(200) NOT NULL, kind varchar(12) NOT NULL CHECK (kind IN ('TEXT','DOCUMENT','LINK','IMAGE')),
 url text, mime varchar(120), data bytea, content text NOT NULL DEFAULT '',
 status varchar(12) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','READY','FAILED')),
 error text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notebook_source_parent ON notebook_source(notebook_id, created_at);
CREATE INDEX notebook_source_pending ON notebook_source(created_at) WHERE status='PENDING';
CREATE TABLE notebook_generation (
 id uuid PRIMARY KEY, notebook_id uuid NOT NULL REFERENCES study_notebook(id) ON DELETE CASCADE,
 question varchar(2000) NOT NULL, mode varchar(24) NOT NULL, level varchar(20) NOT NULL,
 context text NOT NULL, citations jsonb NOT NULL, answer text NOT NULL DEFAULT '',
 status varchar(12) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','READY','FAILED')),
 error text, model text, input_tokens bigint, output_tokens bigint,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notebook_generation_parent ON notebook_generation(notebook_id, created_at);
CREATE INDEX notebook_generation_pending ON notebook_generation(created_at) WHERE status='PENDING';
