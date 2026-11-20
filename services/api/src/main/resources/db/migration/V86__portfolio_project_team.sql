-- Who else made a portfolio project. The author tags a friend; the friend's name only reaches
-- visitors after the friend accepts, and the words about their part are their own.
CREATE TABLE portfolio_project_member (
 owner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 project_id uuid NOT NULL,
 member_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
 status varchar(10) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','DECLINED')),
 contribution varchar(300) NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 answered_at timestamptz,
 PRIMARY KEY(owner_id,project_id,member_id),
 CHECK(owner_id<>member_id)
);
CREATE INDEX portfolio_project_member_of ON portfolio_project_member(member_id,status);
