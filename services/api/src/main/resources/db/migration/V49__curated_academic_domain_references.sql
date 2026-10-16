-- These are email-domain references, never the academic crawler's website allowlist.
-- A catalog imported after deployment receives the same individual associations.
CREATE TABLE academic_email_domain_reference (
 institution_name varchar(250) NOT NULL,
 domain varchar(253) NOT NULL,
 shared boolean NOT NULL,
 source_url varchar(2000) NOT NULL,
 verified_at timestamptz NOT NULL,
 PRIMARY KEY (institution_name,domain)
);
INSERT INTO academic_email_domain_reference VALUES
 ('universidade federal de minas gerais','ufmg.br',false,'https://www.ufmg.br/prograd/noticia/matricula-nas-atividades-de-formacao-transversal-sera-na-proxima-semana/',now()),
 ('pontificia universidade catolica de minas gerais','sga.pucminas.br',false,'https://www.pucminas.br/Pos-Graduacao/IEC/noticias/Paginas/Coronav%C3%ADrus-pos-graduacao.aspx',now()),
 ('centro universitario una','ulife.com.br',true,'https://diploma.una.br/assets/files/faq-central-de-ajuda.pdf',now()),
 ('centro universitario de belo horizonte','ulife.com.br',true,'https://diploma.unibh.br/assets/files/faq-central-de-ajuda.pdf',now());

-- Improve the citation on the original UNA seed, without changing any administrator decision.
UPDATE academic_email_domain SET source_url='https://diploma.una.br/assets/files/faq-central-de-ajuda.pdf'
 WHERE domain='ulife.com.br' AND source_url='https://www.una.br/wp-content/uploads/2024/09/Tutorial-Consulta-Pergamum_03-09-24.pdf';

INSERT INTO academic_email_domain(id,institution_id,domain,status,shared,source_url,verified_at)
 SELECT gen_random_uuid(),i.id,r.domain,'APPROVED',r.shared,r.source_url,r.verified_at
 FROM academic_institution i JOIN academic_email_domain_reference r ON r.institution_name=i.normalized_name
 ON CONFLICT (institution_id,domain) DO NOTHING;

CREATE FUNCTION academic_domain_for_catalog_institution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO academic_email_domain(id,institution_id,domain,status,shared,source_url,verified_at)
  SELECT gen_random_uuid(),NEW.id,r.domain,'APPROVED',r.shared,r.source_url,r.verified_at
  FROM academic_email_domain_reference r WHERE r.institution_name=NEW.normalized_name
  ON CONFLICT (institution_id,domain) DO NOTHING;
 RETURN NEW;
END $$;
CREATE TRIGGER academic_institution_email_reference AFTER INSERT OR UPDATE OF normalized_name ON academic_institution
 FOR EACH ROW EXECUTE FUNCTION academic_domain_for_catalog_institution();
