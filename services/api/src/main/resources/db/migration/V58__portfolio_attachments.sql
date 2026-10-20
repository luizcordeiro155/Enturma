CREATE TABLE portfolio_attachment (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  name varchar(180) NOT NULL,
  mime varchar(80) NOT NULL,
  data bytea NOT NULL CHECK(octet_length(data)<=3145728),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX portfolio_attachment_owner ON portfolio_attachment(user_id);
