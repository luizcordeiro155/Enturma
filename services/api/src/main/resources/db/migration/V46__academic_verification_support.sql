CREATE TABLE academic_verification_support (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id),
 message varchar(2000) NOT NULL, response varchar(2000),
 created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz,
 resolved_by uuid REFERENCES app_user(id)
);
CREATE INDEX academic_support_queue ON academic_verification_support(resolved_at,created_at);
