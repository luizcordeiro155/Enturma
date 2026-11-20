-- Minha Jornada: the student's own timeline. A record is the student's until they choose to
-- show it; nothing here is published by the platform.
CREATE TABLE portfolio_journey_entry (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 kind varchar(16) NOT NULL CHECK(kind IN ('PROJECT','TEAM','COURSE','ACHIEVEMENT','CERTIFICATE','ACTIVITY','GOAL','MILESTONE')),
 title varchar(140) NOT NULL,
 detail varchar(600) NOT NULL DEFAULT '',
 happened_on date NOT NULL,
 visible boolean NOT NULL DEFAULT false,
 -- where an accepted suggestion came from: task:<id>, achievement:<code>, project:<id>
 source varchar(80),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX portfolio_journey_entry_owner ON portfolio_journey_entry(user_id,happened_on DESC);
CREATE UNIQUE INDEX portfolio_journey_entry_source ON portfolio_journey_entry(user_id,source) WHERE source IS NOT NULL;

-- Suggestions the student said no to, so they are not offered again.
CREATE TABLE portfolio_journey_dismissal (
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 source varchar(80) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,source)
);
