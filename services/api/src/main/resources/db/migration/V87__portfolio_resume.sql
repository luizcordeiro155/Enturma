-- What the student chose for their résumé: the model, what goes in, and the contact details
-- that only ever appear on the page they print. Never part of the public portfolio.
CREATE TABLE portfolio_resume (
 user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
 data jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);
