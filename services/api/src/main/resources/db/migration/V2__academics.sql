CREATE TABLE academic_entry (
 id uuid PRIMARY KEY, kind varchar(25) NOT NULL CHECK(kind IN ('INSTITUTION','CAMPUS','COURSE','CURRICULUM','PERIOD','SUBJECT','TOPIC')),
 parent_id uuid REFERENCES academic_entry(id), name varchar(200) NOT NULL, code varchar(80),
 curriculum_version varchar(40), period_number int CHECK(period_number BETWEEN 1 AND 30),
 source_url varchar(2000) NOT NULL, source_name varchar(200) NOT NULL,
 verified_at timestamptz, valid_from date NOT NULL, valid_until date,
 status varchar(25) NOT NULL CHECK(status IN ('VERIFIED','PENDING_VERIFICATION','OUTDATED','ARCHIVED')),
 CHECK(valid_until IS NULL OR valid_until >= valid_from),
 CHECK(status <> 'VERIFIED' OR verified_at IS NOT NULL), CHECK(parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX academic_parent ON academic_entry(parent_id,kind,status);
CREATE INDEX academic_name ON academic_entry(lower(name));
CREATE TABLE academic_enrollment (
 user_id uuid PRIMARY KEY REFERENCES app_user(id), period_id uuid NOT NULL REFERENCES academic_entry(id),
 shift varchar(20) NOT NULL CHECK(shift IN ('MORNING','AFTERNOON','EVENING','FULL_TIME','REMOTE')), preferences varchar(500) NOT NULL DEFAULT ''
);
CREATE TABLE user_subject (user_id uuid REFERENCES app_user(id), subject_id uuid REFERENCES academic_entry(id), PRIMARY KEY(user_id,subject_id));
