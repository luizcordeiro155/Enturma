-- Proof of what each person accepted and when (LGPD arts. 8 and 9): Terms of Use, Privacy Policy and
-- the declaration of being 18 or older. Kept after account erasure as evidence, with the user anonymized.
CREATE TABLE consent_record (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES app_user(id),
 document varchar(20) NOT NULL CHECK(document IN ('TERMS','PRIVACY','AGE_18')),
 version varchar(20) NOT NULL,
 source varchar(20) NOT NULL CHECK(source IN ('SIGN_UP','IN_APP')),
 accepted_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, document, version)
);
CREATE INDEX consent_record_user ON consent_record(user_id, accepted_at);

DO $$ BEGIN
 EXECUTE 'REVOKE ALL ON TABLE consent_record FROM PUBLIC';
 EXECUTE 'ALTER TABLE consent_record ENABLE ROW LEVEL SECURITY';
END $$;

-- Everyone with an account is told about the new policy in the app.
INSERT INTO notification(id,user_id,message,kind,href)
SELECT gen_random_uuid(), id,
 'Atualizamos a Política de Privacidade e os Termos de Uso para a LGPD. Veja seus direitos e confirme a leitura em Privacidade.',
 'SYSTEM', '/settings#privacidade'
FROM app_user WHERE status='ACTIVE';
