-- Enturma Study, phase 1: academic routine, recurring classes, personal holidays and
-- an idempotent reminder queue. Additive only.
CREATE TABLE academic_routine (
 user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
 timezone varchar(64) NOT NULL DEFAULT 'America/Sao_Paulo',
 default_start time NOT NULL DEFAULT '08:00',
 default_end time NOT NULL DEFAULT '12:00',
 weekdays smallint NOT NULL DEFAULT 31 CHECK(weekdays BETWEEN 0 AND 127),
 semester_start date, semester_end date,
 class_reminder_minutes int NOT NULL DEFAULT 120 CHECK(class_reminder_minutes BETWEEN 0 AND 1440),
 quiet_start time, quiet_end time,
 tutor_personality varchar(12) NOT NULL DEFAULT 'BALANCED' CHECK(tutor_personality IN ('WELCOMING','BALANCED','DEMANDING')),
 state varchar(2), city varchar(150),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(default_end > default_start),
 CHECK(semester_end IS NULL OR semester_start IS NULL OR semester_end >= semester_start)
);

CREATE TABLE academic_class_schedule (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 subject_id uuid NOT NULL REFERENCES academic_entry(id),
 weekday smallint NOT NULL CHECK(weekday BETWEEN 1 AND 7),
 starts_at time NOT NULL, ends_at time NOT NULL,
 valid_from date NOT NULL, valid_until date,
 room varchar(120) NOT NULL DEFAULT '',
 version int NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(ends_at > starts_at),
 CHECK(valid_until IS NULL OR valid_until >= valid_from)
);
CREATE INDEX academic_class_schedule_user ON academic_class_schedule(user_id,weekday);

CREATE TABLE academic_class_exception (
 id uuid PRIMARY KEY,
 schedule_id uuid NOT NULL REFERENCES academic_class_schedule(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 occurs_on date NOT NULL,
 kind varchar(10) NOT NULL CHECK(kind IN ('CANCELLED','MOVED','EXTRA')),
 moved_to timestamptz,
 minutes int CHECK(minutes BETWEEN 5 AND 720),
 note varchar(300) NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(kind = 'CANCELLED' OR moved_to IS NOT NULL),
 UNIQUE(schedule_id,occurs_on,kind)
);
CREATE INDEX academic_class_exception_user ON academic_class_exception(user_id,occurs_on);

-- Personal holidays (city holidays, optional days). National and state holidays are computed.
CREATE TABLE calendar_holiday (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 date date NOT NULL,
 name varchar(120) NOT NULL,
 scope varchar(10) NOT NULL CHECK(scope IN ('CITY','OPTIONAL')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,date,name)
);

CREATE TABLE academic_reminder_job (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 kind varchar(8) NOT NULL CHECK(kind IN ('CLASS','STUDY','EXAM','REVIEW')),
 source_id uuid NOT NULL,
 occurrence_at timestamptz NOT NULL,
 fire_at timestamptz NOT NULL,
 status varchar(10) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','CANCELLED')),
 attempts int NOT NULL DEFAULT 0,
 lease_until timestamptz,
 sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,kind,source_id,occurrence_at)
);
CREATE INDEX academic_reminder_due ON academic_reminder_job(fire_at) WHERE status='PENDING';

ALTER TABLE notification_preference DROP CONSTRAINT notification_preference_category_check;
ALTER TABLE notification_preference ADD CONSTRAINT notification_preference_category_check CHECK (category IN ('ROOM_MESSAGE','PRIVATE_MESSAGE','MENTION','ROOM_NOTICE','FORUM','ACHIEVEMENT','RIDE','FRIEND','SOCIAL_CONTENT','SOCIAL_RELATIONSHIP','SOCIAL_INTERACTION','SOCIAL_VERIFICATION','STUDY_REMINDER'));

-- Match the existing default-deny direct database policy; the Java owner still checks every actor.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['academic_routine','academic_class_schedule','academic_class_exception','calendar_holiday','academic_reminder_job']
 LOOP
  EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC',t);
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
