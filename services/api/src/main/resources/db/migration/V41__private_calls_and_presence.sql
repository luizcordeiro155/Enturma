CREATE TABLE realtime_presence (
  connection_id varchar(120) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX realtime_presence_user ON realtime_presence(user_id, expires_at);
CREATE TABLE private_call (
  id uuid PRIMARY KEY,
  friendship_id uuid NOT NULL,
  caller_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  callee_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  video boolean NOT NULL DEFAULT false,
  caller_device uuid NOT NULL,
  callee_device uuid,
  state varchar(16) NOT NULL CHECK (state IN ('DIALING','RINGING','ACCEPTED','CONNECTING','CONNECTED','DECLINED','CANCELLED','NO_ANSWER','ENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  caller_heartbeat timestamptz,
  callee_heartbeat timestamptz,
  caller_connected boolean NOT NULL DEFAULT false,
  callee_connected boolean NOT NULL DEFAULT false,
  last_token_at timestamptz,
  cleaned_at timestamptz,
  CHECK (caller_id <> callee_id)
);
CREATE INDEX private_call_caller ON private_call(caller_id, updated_at DESC);
CREATE INDEX private_call_callee ON private_call(callee_id, updated_at DESC);
CREATE INDEX private_call_active ON private_call(expires_at) WHERE state IN ('DIALING','RINGING','ACCEPTED','CONNECTING','CONNECTED');
