-- Each semester a student goes through: its dates, the course period and the subjects of that time.
-- The latest one is the current semester, mirrored in academic_routine.semester_start/end.
CREATE TABLE academic_term (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 name varchar(40) NOT NULL,
 starts_on date NOT NULL,
 ends_on date NOT NULL,
 period_id uuid,
 subjects jsonb NOT NULL DEFAULT '[]',
 subjects_confirmed boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_on >= starts_on AND ends_on - starts_on <= 400),
 UNIQUE(user_id, starts_on)
);

-- Students who already set their semester keep it, with the subjects they have today.
INSERT INTO academic_term(id,user_id,name,starts_on,ends_on,period_id,subjects,subjects_confirmed)
SELECT gen_random_uuid(), r.user_id,
 extract(year FROM r.semester_start)::int || '.' || CASE WHEN extract(month FROM r.semester_start) <= 6 THEN 1 ELSE 2 END,
 r.semester_start, r.semester_end,
 (SELECT e.period_id FROM academic_enrollment e WHERE e.user_id=r.user_id),
 coalesce((SELECT jsonb_agg(s.subject_id) FROM user_subject s WHERE s.user_id=r.user_id),'[]'),
 EXISTS(SELECT 1 FROM user_subject s WHERE s.user_id=r.user_id)
FROM academic_routine r
WHERE r.semester_start IS NOT NULL AND r.semester_end IS NOT NULL
 AND r.semester_end - r.semester_start <= 400;

DO $$ BEGIN
 EXECUTE 'REVOKE ALL ON TABLE academic_term FROM PUBLIC';
 EXECUTE 'ALTER TABLE academic_term ENABLE ROW LEVEL SECURITY';
END $$;
