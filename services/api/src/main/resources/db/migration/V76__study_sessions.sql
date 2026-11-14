-- Enturma Study: scheduled study sessions with the AI tutor, quizzes and mastery.
-- Additive only. Tutor turns reuse notebook_generation in the session's notebook.
CREATE TABLE study_session (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 subject_id uuid NOT NULL REFERENCES academic_entry(id),
 notebook_id uuid REFERENCES study_notebook(id) ON DELETE SET NULL,
 starts_at timestamptz NOT NULL,
 minutes int NOT NULL CHECK(minutes BETWEEN 15 AND 240),
 goal varchar(300) NOT NULL DEFAULT '',
 status varchar(10) NOT NULL DEFAULT 'PLANNED' CHECK(status IN ('PLANNED','ACTIVE','DONE','SKIPPED')),
 personality varchar(12) NOT NULL DEFAULT 'BALANCED' CHECK(personality IN ('WELCOMING','BALANCED','DEMANDING')),
 difficulty varchar(1000) NOT NULL DEFAULT '',
 started_at timestamptz, finished_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX study_session_user ON study_session(user_id,starts_at);

CREATE TABLE study_quiz_attempt (
 id uuid PRIMARY KEY,
 session_id uuid NOT NULL REFERENCES study_session(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 generation_id uuid NOT NULL REFERENCES notebook_generation(id) ON DELETE CASCADE,
 answers jsonb NOT NULL,
 score int NOT NULL, total int NOT NULL,
 wrong_topics jsonb NOT NULL DEFAULT '[]',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(generation_id)
);

CREATE TABLE subject_mastery (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 subject_id uuid NOT NULL REFERENCES academic_entry(id),
 level varchar(24) NOT NULL DEFAULT 'BEGINNER' CHECK(level IN ('BEGINNER','DEVELOPING','INTERMEDIATE','ADVANCED','MASTERED')),
 evidence jsonb NOT NULL DEFAULT '{}',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,subject_id)
);

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['study_session','study_quiz_attempt','subject_mastery']
 LOOP
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',t);
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
