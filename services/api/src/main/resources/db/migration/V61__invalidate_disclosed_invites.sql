-- Discovery previously serialized share_code. Existing members keep their access;
-- the authorized sharing endpoint creates a fresh code when next requested.
UPDATE study_room SET share_code=NULL WHERE status IN ('OPEN','ACTIVE') AND share_code IS NOT NULL;
