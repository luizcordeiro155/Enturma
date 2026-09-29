CREATE TABLE learning_mission_start(user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE, started_on date NOT NULL);
CREATE TABLE learning_mission(
 user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE, mission_date date NOT NULL,
 game varchar(16) NOT NULL CHECK(game IN ('words','binary','algorithm','trace')), slot integer NOT NULL CHECK(slot BETWEEN 1 AND 5),
 difficulty integer NOT NULL, definition jsonb NOT NULL, attempts integer NOT NULL DEFAULT 0,
 history jsonb NOT NULL DEFAULT '[]', completed boolean NOT NULL DEFAULT false, won boolean NOT NULL DEFAULT false,
 PRIMARY KEY(user_id,mission_date,game,slot)
);
