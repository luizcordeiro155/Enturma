-- School breaks the student can move or remove, and whether they went to each class.

CREATE TABLE calendar_vacation (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 starts_on date NOT NULL,
 ends_on date NOT NULL,
 name varchar(80) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_on >= starts_on AND ends_on - starts_on <= 120)
);
CREATE INDEX calendar_vacation_user ON calendar_vacation(user_id, starts_on);

-- Default breaks are created once per year; a removed one never comes back.
CREATE TABLE calendar_vacation_year (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 year int NOT NULL,
 PRIMARY KEY(user_id, year)
);

CREATE TABLE class_attendance (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 occurrence_key varchar(120) NOT NULL,
 schedule_id uuid NOT NULL REFERENCES academic_class_schedule(id) ON DELETE CASCADE,
 occurs_on date NOT NULL,
 status varchar(8) NOT NULL CHECK(status IN ('PRESENT','ABSENT')),
 answered_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, occurrence_key)
);
CREATE INDEX class_attendance_day ON class_attendance(user_id, occurs_on);

ALTER TABLE academic_reminder_job DROP CONSTRAINT academic_reminder_job_kind_check;
ALTER TABLE academic_reminder_job ADD CONSTRAINT academic_reminder_job_kind_check
 CHECK(kind IN ('CLASS','STUDY','EXAM','REVIEW','ATTEND'));

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['calendar_vacation','calendar_vacation_year','class_attendance']
 LOOP
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',t);
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
