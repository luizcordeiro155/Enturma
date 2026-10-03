ALTER TABLE teacher_submission
  ADD COLUMN score int CHECK(score BETWEEN 0 AND 1000),
  ADD COLUMN feedback varchar(2000) NOT NULL DEFAULT '',
  ADD COLUMN reviewed_at timestamptz;

ALTER TABLE teacher_class
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX teacher_class_owner_active
  ON teacher_class(owner_id,archived,updated_at DESC);
