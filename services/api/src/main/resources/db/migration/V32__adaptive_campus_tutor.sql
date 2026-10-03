CREATE TABLE campus_learning_profile (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  learning_notes varchar(3000) NOT NULL DEFAULT 'Perfil adaptativo em formação.',
  interaction_count int NOT NULL DEFAULT 0,
  helpful_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE campus_tutor_interaction (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES academic_entry(id) ON DELETE SET NULL,
  focus_session_id uuid REFERENCES focus_session(id) ON DELETE SET NULL,
  action varchar(24) NOT NULL DEFAULT 'EXPLAIN',
  prompt varchar(2000) NOT NULL,
  response varchar(8000) NOT NULL,
  rating smallint CHECK(rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX campus_tutor_user_recent ON campus_tutor_interaction(user_id,created_at DESC);
