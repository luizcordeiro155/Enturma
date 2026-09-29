CREATE TABLE learning_progress (
 user_id uuid NOT NULL REFERENCES app_user(id), game varchar(30) NOT NULL,
 level int NOT NULL CHECK(level BETWEEN 1 AND 4), attempts int NOT NULL DEFAULT 0,
 completed boolean NOT NULL DEFAULT false, completed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,game,level)
);
