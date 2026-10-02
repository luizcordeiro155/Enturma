ALTER TABLE study_room ADD COLUMN lifecycle varchar(12) NOT NULL DEFAULT 'QUICK' CHECK(lifecycle IN ('QUICK','MULTIDAY'));
ALTER TABLE study_room ADD COLUMN empty_since timestamptz;
ALTER TABLE study_room ADD COLUMN entries_locked boolean NOT NULL DEFAULT false;
ALTER TABLE study_room ADD COLUMN topic_text varchar(500) NOT NULL DEFAULT '';
ALTER TABLE room_participant ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX room_presence ON room_participant(room_id,last_seen_at) WHERE left_at IS NULL AND NOT removed;
CREATE TABLE room_system_event (
 id uuid PRIMARY KEY, room_id uuid NOT NULL REFERENCES study_room(id), user_id uuid REFERENCES app_user(id),
 kind varchar(40) NOT NULL, message varchar(1000) NOT NULL, event_key varchar(180) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(room_id,event_key)
);
CREATE INDEX room_event_history ON room_system_event(room_id,created_at);
CREATE TABLE notification_preference (
 user_id uuid NOT NULL REFERENCES app_user(id), category varchar(24) NOT NULL CHECK(category IN ('ROOM_MESSAGE','ROOM_NOTICE','FORUM','ACHIEVEMENT','RIDE','FRIEND')),
 in_app boolean NOT NULL DEFAULT true, email boolean NOT NULL DEFAULT false, PRIMARY KEY(user_id,category)
);
ALTER TABLE email_outbox ADD COLUMN user_id uuid REFERENCES app_user(id);
ALTER TABLE email_outbox ADD COLUMN category varchar(24);
ALTER TABLE email_outbox ADD COLUMN dedupe_key varchar(200);
CREATE UNIQUE INDEX email_event_dedupe ON email_outbox(user_id,dedupe_key);
CREATE TABLE achievement_definition (
 code varchar(60) PRIMARY KEY, version int NOT NULL DEFAULT 1, name varchar(100) NOT NULL, description varchar(400) NOT NULL,
 icon varchar(40) NOT NULL, category varchar(24) NOT NULL, metric varchar(60) NOT NULL, requirement int NOT NULL CHECK(requirement>0),
 tier varchar(16) NOT NULL DEFAULT 'BRONZE', xp int NOT NULL CHECK(xp BETWEEN 1 AND 500)
);
CREATE TABLE user_achievement (
 user_id uuid NOT NULL REFERENCES app_user(id), code varchar(60) NOT NULL REFERENCES achievement_definition(code), definition_version int NOT NULL,
 earned_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,code)
);
CREATE TABLE achievement_progress (
 user_id uuid NOT NULL REFERENCES app_user(id), code varchar(60) NOT NULL REFERENCES achievement_definition(code), progress bigint NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,code)
);
CREATE TABLE profile_showcase (
 user_id uuid PRIMARY KEY REFERENCES app_user(id), secondary_color varchar(7) NOT NULL DEFAULT '#799f80',
 theme varchar(16) NOT NULL DEFAULT 'SOLID' CHECK(theme IN ('SOLID','GRADIENT')),
 effect varchar(16) NOT NULL DEFAULT 'NONE' CHECK(effect IN ('NONE','AURORA','DOTS')),
 layout varchar(16) NOT NULL DEFAULT 'IDENTITY_FIRST' CHECK(layout IN ('IDENTITY_FIRST','WIDGETS_FIRST')),
 goal varchar(200) NOT NULL DEFAULT '', technologies varchar(200) NOT NULL DEFAULT '', projects varchar(1000) NOT NULL DEFAULT ''
);
CREATE TABLE profile_privacy_setting (
 user_id uuid NOT NULL REFERENCES app_user(id), field varchar(30) NOT NULL CHECK(field IN ('ACADEMIC','STATS','ACHIEVEMENTS','JOINED','WIDGETS')),
 visible boolean NOT NULL DEFAULT false, PRIMARY KEY(user_id,field)
);
CREATE TABLE profile_widget (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), kind varchar(30) NOT NULL,
 position int NOT NULL CHECK(position BETWEEN 0 AND 7), visible boolean NOT NULL DEFAULT true, favorite boolean NOT NULL DEFAULT false,
 UNIQUE(user_id,kind), UNIQUE(user_id,position)
);
CREATE TABLE profile_featured_badge (
 user_id uuid NOT NULL, code varchar(60) NOT NULL, position int NOT NULL CHECK(position BETWEEN 0 AND 3),
 PRIMARY KEY(user_id,code), UNIQUE(user_id,position), FOREIGN KEY(user_id,code) REFERENCES user_achievement(user_id,code)
);
CREATE TABLE moderation_case (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), room_id uuid REFERENCES study_room(id),
 rule varchar(60) NOT NULL, confidence numeric(4,3) NOT NULL DEFAULT 1, source varchar(24) NOT NULL,
 dedupe_key varchar(180) NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), status varchar(20) NOT NULL DEFAULT 'OPEN',
 appeal varchar(2000), appealed_at timestamptz, reviewed_by uuid REFERENCES app_user(id), review_note varchar(2000), reviewed_at timestamptz
);
CREATE TABLE moderation_action (
 id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES moderation_case(id), kind varchar(24) NOT NULL,
 starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, revoked_at timestamptz, responsible_id uuid REFERENCES app_user(id), UNIQUE(case_id,kind)
);
CREATE TABLE moderation_evidence (
 id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES moderation_case(id), content varchar(4000) NOT NULL, message_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_user_active ON moderation_case(user_id,room_id,created_at DESC);
CREATE INDEX moderation_expiry ON moderation_action(ends_at) WHERE revoked_at IS NULL;
CREATE TABLE academic_game_definition (
 code varchar(40) PRIMARY KEY, category varchar(30) NOT NULL, title varchar(100) NOT NULL, template varchar(30) NOT NULL, version int NOT NULL DEFAULT 1
);
CREATE TABLE academic_game_assignment (
 subject_id uuid NOT NULL REFERENCES academic_entry(id), game_code varchar(40) NOT NULL REFERENCES academic_game_definition(code),
 PRIMARY KEY(subject_id,game_code)
);
CREATE TABLE academic_game_progress (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), subject_id uuid NOT NULL REFERENCES academic_entry(id), game_code varchar(40) NOT NULL REFERENCES academic_game_definition(code),
 challenge_date date NOT NULL, slot int NOT NULL CHECK(slot BETWEEN 1 AND 5), daily boolean NOT NULL,
 difficulty int NOT NULL CHECK(difficulty BETWEEN 1 AND 10), definition jsonb NOT NULL, attempts int NOT NULL DEFAULT 0,
 completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX academic_game_daily ON academic_game_progress(user_id,subject_id,game_code,challenge_date,slot) WHERE daily;
CREATE INDEX academic_game_user ON academic_game_progress(user_id,created_at DESC);
INSERT INTO achievement_definition(code,name,description,icon,category,metric,requirement,tier,xp) VALUES
('FIRST_SPARK','Primeira Faísca','Conclua seu primeiro desafio diário.','Flame','ESTUDO','daily',1,'BRONZE',40),
('STREAK_3','Ritmo de Estudos','Estude em três dias consecutivos.','Calendar','CONSTÂNCIA','streak',3,'BRONZE',60),
('STREAK_14','Constância de Ferro','Estude em quatorze dias consecutivos.','Calendar','CONSTÂNCIA','streak',14,'OURO',180),
('GAMES_10','Mente Afiada','Conclua dez desafios.','Brain','MINIGAMES','games',10,'PRATA',80),
('ADVANCED_5','Mestre do Desafio','Conclua cinco desafios de dificuldade avançada.','Trophy','MINIGAMES','advanced',5,'OURO',120),
('UP_5','Voz da Comunidade','Receba cinco UPs em uma publicação.','MessageCircle','FÓRUM','up',5,'BRONZE',50),
('UP_25','Post em Alta','Receba vinte e cinco UPs em uma publicação.','TrendingUp','FÓRUM','up',25,'OURO',150),
('DISCUSSION_10','Contribuidor','Participe com comentários em dez discussões.','MessagesSquare','COMUNIDADE','discussions',10,'PRATA',80),
('MENTOR_10','Mentor da Turma','Receba dez UPs em uma resposta.','GraduationCap','COLABORAÇÃO','answerUp',10,'PRATA',100),
('ROOMS_5','Parceiro de Estudos','Participe de cinco salas com mensagens.','Users','SALAS','rooms',5,'BRONZE',70),
('HOURS_10','Maratonista Acadêmico','Acumule dez horas de presença em salas.','Clock','ESTUDO','minutes',600,'OURO',150),
('NOTEBOOK_3','Colecionador de Conhecimento','Use fontes em três cadernos.','BookOpen','ESTUDO','notebooks',3,'PRATA',80),
('SUBJECTS_3','Explorador Acadêmico','Converse em salas de três disciplinas.','Compass','ESTUDO','subjects',3,'PRATA',80),
('PRESENCE_30','Presença Marcante','Conclua atividades em trinta dias distintos.','Sparkles','CONSTÂNCIA','days',30,'OURO',150),
('VETERAN','Veterano Enturma','Tenha um ano de conta e atividade em trinta dias.','Shield','CONTA','veteran',1,'PLATINA',200);
ALTER TABLE room_participant ADD COLUMN study_seconds bigint NOT NULL DEFAULT 0 CHECK(study_seconds>=0);

CREATE TABLE moderation_blocked_host(host varchar(253) PRIMARY KEY, reason varchar(300) NOT NULL, added_by uuid NOT NULL REFERENCES app_user(id), created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE achievement_sync_queue(user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE, queued_at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION queue_achievement_sync() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid;
BEGIN
 IF TG_TABLE_NAME='forum_vote' THEN
   SELECT author_id INTO target FROM forum_entry WHERE id=COALESCE(NEW.entry_id,OLD.entry_id);
 ELSIF TG_TABLE_NAME='forum_entry' THEN target:=NEW.author_id;
 ELSIF TG_TABLE_NAME='notebook_generation' THEN SELECT user_id INTO target FROM study_notebook WHERE id=NEW.notebook_id;
 ELSE target:=NEW.user_id;
 END IF;
 IF target IS NOT NULL THEN INSERT INTO achievement_sync_queue(user_id) VALUES(target) ON CONFLICT DO NOTHING; END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER achievement_room_message AFTER INSERT ON room_message FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_room_presence AFTER UPDATE OF study_seconds ON room_participant FOR EACH ROW WHEN (NEW.study_seconds/60>OLD.study_seconds/60) EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_learning AFTER INSERT OR UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_daily AFTER INSERT OR UPDATE ON learning_mission FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_academic AFTER INSERT OR UPDATE ON academic_game_progress FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_forum AFTER INSERT OR UPDATE ON forum_entry FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_forum_vote AFTER INSERT OR UPDATE OR DELETE ON forum_vote FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
CREATE TRIGGER achievement_notebook AFTER INSERT OR UPDATE OF status ON notebook_generation FOR EACH ROW EXECUTE FUNCTION queue_achievement_sync();
