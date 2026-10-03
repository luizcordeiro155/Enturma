CREATE TABLE campus_task (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 subject_id uuid REFERENCES academic_entry(id),
 kind varchar(24) NOT NULL CHECK(kind IN ('CLASS','EXAM','ASSIGNMENT','PRESENTATION','STUDY','GROUP','EVENT')),
 title varchar(180) NOT NULL,
 notes varchar(1200) NOT NULL DEFAULT '',
 due_at timestamptz NOT NULL,
 estimated_minutes int NOT NULL DEFAULT 30 CHECK(estimated_minutes BETWEEN 5 AND 1440),
 priority varchar(12) NOT NULL DEFAULT 'NORMAL' CHECK(priority IN ('LOW','NORMAL','HIGH','URGENT')),
 completed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX campus_task_user_due ON campus_task(user_id,due_at) WHERE completed_at IS NULL;

CREATE TABLE focus_session (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 subject_id uuid REFERENCES academic_entry(id),
 label varchar(180) NOT NULL DEFAULT 'Sessão de foco',
 planned_minutes int NOT NULL CHECK(planned_minutes BETWEEN 5 AND 240),
 started_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz,
 actual_seconds bigint NOT NULL DEFAULT 0 CHECK(actual_seconds>=0)
);
CREATE INDEX focus_session_user ON focus_session(user_id,started_at DESC);

CREATE TABLE study_match_profile (
 user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
 subject_id uuid REFERENCES academic_entry(id),
 goal varchar(200) NOT NULL DEFAULT '',
 available_now boolean NOT NULL DEFAULT false,
 preferred_mode varchar(16) NOT NULL DEFAULT 'ANY' CHECK(preferred_mode IN ('TEXT','VOICE','VIDEO','ANY')),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_group (
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES app_user(id),
 subject_id uuid REFERENCES academic_entry(id),
 name varchar(120) NOT NULL,
 description varchar(600) NOT NULL DEFAULT '',
 visibility varchar(12) NOT NULL DEFAULT 'PRIVATE' CHECK(visibility IN ('PRIVATE','COURSE','PUBLIC')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE study_group_member (
 group_id uuid NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 role varchar(12) NOT NULL DEFAULT 'MEMBER' CHECK(role IN ('OWNER','MEMBER')),
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(group_id,user_id)
);

CREATE TABLE study_flashcard (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 notebook_id uuid REFERENCES study_notebook(id) ON DELETE CASCADE,
 subject_id uuid REFERENCES academic_entry(id),
 front varchar(1200) NOT NULL,
 back varchar(2400) NOT NULL,
 next_review_at timestamptz NOT NULL DEFAULT now(),
 interval_days int NOT NULL DEFAULT 0,
 ease numeric(4,2) NOT NULL DEFAULT 2.50,
 review_count int NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX flashcard_due ON study_flashcard(user_id,next_review_at);

CREATE TABLE campus_opportunity (
 id uuid PRIMARY KEY,
 title varchar(180) NOT NULL,
 organization varchar(160) NOT NULL,
 kind varchar(24) NOT NULL CHECK(kind IN ('INTERNSHIP','JUNIOR','SCHOLARSHIP','RESEARCH','HACKATHON','COURSE','EXCHANGE')),
 url varchar(1000) NOT NULL,
 city varchar(120) NOT NULL DEFAULT '',
 course_hint varchar(160) NOT NULL DEFAULT '',
 expires_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campus_event (
 id uuid PRIMARY KEY,
 title varchar(180) NOT NULL,
 organization varchar(160) NOT NULL,
 description varchar(1000) NOT NULL DEFAULT '',
 starts_at timestamptz NOT NULL,
 url varchar(1000) NOT NULL DEFAULT '',
 city varchar(120) NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE account_deletion_request (
 user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
 requested_at timestamptz NOT NULL DEFAULT now(),
 execute_at timestamptz NOT NULL,
 mode varchar(12) NOT NULL CHECK(mode IN ('DELAYED','IMMEDIATE')),
 cancelled_at timestamptz,
 executed_at timestamptz
);
