ALTER TABLE teacher_class
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE teacher_submission
  ADD COLUMN IF NOT EXISTS score int,
  ADD COLUMN IF NOT EXISTS feedback varchar(2000) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_submission_score_check'
  ) THEN
    ALTER TABLE teacher_submission
      ADD CONSTRAINT teacher_submission_score_check
      CHECK (score IS NULL OR (score BETWEEN 0 AND 1000));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS teacher_class_owner_active
  ON teacher_class(owner_id,archived,updated_at DESC);
