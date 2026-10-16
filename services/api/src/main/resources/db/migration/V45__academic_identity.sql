-- Flyway runs this migration transactionally. Lock registration while taking the
-- exact legacy snapshot and installing the trigger for all subsequent accounts.
LOCK TABLE app_user IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE academic_identity (
 user_id uuid PRIMARY KEY REFERENCES app_user(id),
 status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('LEGACY_APPROVED','PENDING','EMAIL_PENDING','PENDING_REVIEW','STUDENT_VERIFIED','REJECTED')),
 institution_id uuid REFERENCES academic_institution(id), campus_id uuid REFERENCES academic_campus(id),
 academic_email varchar(254), method varchar(30), confidence varchar(40),
 verified_at timestamptz, review_reason varchar(1000), revision bigint NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX academic_identity_verified_email ON academic_identity(lower(academic_email))
 WHERE status='STUDENT_VERIFIED' AND academic_email IS NOT NULL;
CREATE TABLE academic_legacy_snapshot (
 user_id uuid PRIMARY KEY REFERENCES app_user(id), captured_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO academic_legacy_snapshot(user_id) SELECT id FROM app_user ON CONFLICT DO NOTHING;
INSERT INTO academic_identity(user_id,status,method,confidence)
 SELECT user_id,'LEGACY_APPROVED','COMPATIBILITY','LEGACY_ACCESS_ONLY' FROM academic_legacy_snapshot
 ON CONFLICT(user_id) DO NOTHING;
CREATE FUNCTION academic_identity_for_new_account() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO academic_identity(user_id) VALUES(NEW.id) ON CONFLICT DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER app_user_academic_identity AFTER INSERT ON app_user
 FOR EACH ROW EXECUTE FUNCTION academic_identity_for_new_account();

CREATE TABLE academic_email_domain (
 id uuid PRIMARY KEY, institution_id uuid NOT NULL REFERENCES academic_institution(id),
 domain varchar(253) NOT NULL CHECK(domain=lower(domain) AND domain NOT LIKE '%@%'),
 status varchar(20) NOT NULL CHECK(status IN ('APPROVED','DISABLED','PENDING')),
 shared boolean NOT NULL DEFAULT false, allow_subdomains boolean NOT NULL DEFAULT false,
 source_url varchar(2000) NOT NULL, verified_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(institution_id,domain)
);
CREATE INDEX academic_email_domain_lookup ON academic_email_domain(institution_id,status);
CREATE TABLE academic_verification_token (
 token_hash varchar(64) PRIMARY KEY, user_id uuid NOT NULL UNIQUE REFERENCES app_user(id),
 institution_id uuid NOT NULL REFERENCES academic_institution(id), domain_id uuid NOT NULL REFERENCES academic_email_domain(id),
 email varchar(254) NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE academic_verification_document (
 user_id uuid PRIMARY KEY REFERENCES app_user(id), request_id uuid NOT NULL UNIQUE,
 mime varchar(80) NOT NULL, content bytea NOT NULL CHECK(octet_length(content)<=2097152),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '14 days'
);
CREATE TABLE academic_verification_audit (
 id uuid PRIMARY KEY, user_id uuid REFERENCES app_user(id), actor_id uuid REFERENCES app_user(id),
 action varchar(60) NOT NULL, reason varchar(1000), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academic_verification_audit_time ON academic_verification_audit(created_at DESC);
CREATE INDEX academic_identity_review_queue ON academic_identity(status,updated_at);
ALTER TABLE email_outbox ADD academic_verification_user uuid REFERENCES app_user(id), ADD delivery_expires_at timestamptz;

-- Independently sourced mappings only. Unknown institutions use document review.
INSERT INTO academic_email_domain(id,institution_id,domain,status,shared,source_url,verified_at)
SELECT gen_random_uuid(),id,'ufmg.br','APPROVED',false,
 'https://www.ufmg.br/prograd/noticia/matricula-nas-atividades-de-formacao-transversal-sera-na-proxima-semana/',now()
FROM academic_institution WHERE normalized_name='universidade federal de minas gerais';
INSERT INTO academic_email_domain(id,institution_id,domain,status,shared,source_url,verified_at)
SELECT gen_random_uuid(),id,'sga.pucminas.br','APPROVED',false,
 'https://www.pucminas.br/Pos-Graduacao/IEC/noticias/Paginas/Coronav%C3%ADrus-pos-graduacao.aspx',now()
FROM academic_institution WHERE normalized_name='pontificia universidade catolica de minas gerais';
INSERT INTO academic_email_domain(id,institution_id,domain,status,shared,source_url,verified_at)
SELECT gen_random_uuid(),id,'ulife.com.br','APPROVED',true,
 'https://www.una.br/wp-content/uploads/2024/09/Tutorial-Consulta-Pergamum_03-09-24.pdf',now()
FROM academic_institution WHERE normalized_name='centro universitario una';
