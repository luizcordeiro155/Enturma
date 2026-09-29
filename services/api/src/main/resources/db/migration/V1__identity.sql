CREATE TABLE app_user (
 id uuid PRIMARY KEY, name varchar(100) NOT NULL, username varchar(40) NOT NULL UNIQUE,
 email varchar(254) NOT NULL UNIQUE, password_hash varchar(255) NOT NULL,
 role varchar(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','MODERATOR','ADMIN','SUPER_ADMIN')),
 status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','SUSPENDED','BANNED','DELETED')),
 email_verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_session (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), device varchar(150) NOT NULL,
 access_hash varchar(64) UNIQUE NOT NULL, access_expires_at timestamptz NOT NULL,
 refresh_hash varchar(64) UNIQUE NOT NULL, expires_at timestamptz NOT NULL,
 revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_user ON user_session(user_id);
CREATE TABLE used_refresh_token (token_hash varchar(64) PRIMARY KEY, session_id uuid NOT NULL REFERENCES user_session(id) ON DELETE CASCADE);
CREATE TABLE account_token (token_hash varchar(64) PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), purpose varchar(20) NOT NULL, expires_at timestamptz NOT NULL);
CREATE TABLE email_outbox (id uuid PRIMARY KEY, recipient varchar(254) NOT NULL, subject varchar(150) NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, attempts int NOT NULL DEFAULT 0);
CREATE TABLE rate_limit (bucket varchar(150) PRIMARY KEY, hits int NOT NULL, resets_at timestamptz NOT NULL);
CREATE TABLE audit_log (id uuid PRIMARY KEY, actor_id uuid REFERENCES app_user(id), action varchar(80) NOT NULL, resource_id uuid, before_value jsonb, after_value jsonb, created_at timestamptz NOT NULL DEFAULT now());
