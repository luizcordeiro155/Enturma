ALTER TABLE app_user ADD COLUMN profile_details jsonb NOT NULL DEFAULT '{}';
CREATE TABLE friendship (
 id uuid PRIMARY KEY, requester uuid NOT NULL REFERENCES app_user(id),
 recipient uuid NOT NULL REFERENCES app_user(id), status varchar(12) NOT NULL DEFAULT 'PENDING',
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(requester<>recipient),
 CHECK(status IN ('PENDING','ACCEPTED'))
);
CREATE UNIQUE INDEX friendship_pair ON friendship(least(requester,recipient),greatest(requester,recipient));
CREATE TABLE private_identity(user_id uuid PRIMARY KEY REFERENCES app_user(id), public_key jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE private_message (
 id uuid PRIMARY KEY, friendship_id uuid NOT NULL REFERENCES friendship(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES app_user(id), ciphertext text NOT NULL,
 iv varchar(24) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 client_id uuid NOT NULL, UNIQUE(sender_id,client_id)
);
CREATE INDEX private_message_history ON private_message(friendship_id,created_at DESC,id DESC);
