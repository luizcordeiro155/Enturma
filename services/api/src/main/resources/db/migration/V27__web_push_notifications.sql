CREATE TABLE web_push_vapid_key (
  id int PRIMARY KEY CHECK(id = 1),
  public_key text NOT NULL,
  private_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_web_push_subscription (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  installation_id varchar(100) NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, installation_id),
  UNIQUE(endpoint)
);

CREATE INDEX notification_web_push_subscription_user
  ON notification_web_push_subscription(user_id)
  WHERE enabled;
