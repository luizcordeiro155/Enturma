ALTER TABLE forum_entry
  ADD COLUMN accepted_answer_id uuid REFERENCES forum_entry(id) ON DELETE SET NULL;

ALTER TABLE study_room
  ADD COLUMN share_code varchar(12);
CREATE UNIQUE INDEX study_room_share_code_unique
  ON study_room(share_code) WHERE share_code IS NOT NULL;

CREATE TABLE portfolio_profile (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  public boolean NOT NULL DEFAULT false,
  headline varchar(140) NOT NULL DEFAULT '',
  summary varchar(1200) NOT NULL DEFAULT '',
  skills jsonb NOT NULL DEFAULT '[]',
  projects jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teacher_profile (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  institution varchar(180) NOT NULL DEFAULT '',
  title varchar(120) NOT NULL DEFAULT 'Professor(a)',
  enabled boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teacher_class (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES academic_entry(id),
  name varchar(140) NOT NULL,
  description varchar(800) NOT NULL DEFAULT '',
  join_code varchar(10) NOT NULL UNIQUE,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teacher_class_member (
  class_id uuid NOT NULL REFERENCES teacher_class(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role varchar(16) NOT NULL DEFAULT 'STUDENT' CHECK(role IN ('STUDENT','ASSISTANT')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(class_id,user_id)
);

CREATE TABLE teacher_assignment (
  id uuid PRIMARY KEY,
  class_id uuid NOT NULL REFERENCES teacher_class(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  description varchar(2000) NOT NULL DEFAULT '',
  due_at timestamptz,
  points int NOT NULL DEFAULT 0 CHECK(points BETWEEN 0 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teacher_submission (
  assignment_id uuid NOT NULL REFERENCES teacher_assignment(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  status varchar(16) NOT NULL DEFAULT 'DONE' CHECK(status IN ('DONE','REVIEWED')),
  note varchar(1200) NOT NULL DEFAULT '',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(assignment_id,user_id)
);

CREATE TABLE study_group_task (
  id uuid PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES study_group(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES app_user(id) ON DELETE SET NULL,
  title varchar(180) NOT NULL,
  description varchar(1200) NOT NULL DEFAULT '',
  status varchar(16) NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO','DOING','DONE')),
  due_at timestamptz,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX study_group_task_board ON study_group_task(group_id,status,position,created_at);

CREATE TABLE practice_session (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES academic_entry(id),
  title varchar(180) NOT NULL,
  focus_topics jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practice_question (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES practice_session(id) ON DELETE CASCADE,
  topic varchar(120) NOT NULL DEFAULT 'Geral',
  prompt varchar(1800) NOT NULL,
  options jsonb NOT NULL,
  answer_index int NOT NULL CHECK(answer_index BETWEEN 0 AND 7),
  explanation varchar(2400) NOT NULL,
  difficulty int NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practice_attempt (
  question_id uuid NOT NULL REFERENCES practice_question(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  selected_index int NOT NULL,
  correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(question_id,user_id)
);
CREATE INDEX practice_attempt_user ON practice_attempt(user_id,created_at DESC);
