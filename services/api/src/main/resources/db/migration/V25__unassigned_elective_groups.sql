-- An official elective pool has no semester number. Preserve this fact instead
-- of assigning an invented extra semester to the student's curriculum.
ALTER TABLE academic_curriculum_period ALTER COLUMN number DROP NOT NULL;
ALTER TABLE academic_curriculum_period ADD COLUMN organization varchar(20) NOT NULL DEFAULT 'PERIOD';
ALTER TABLE academic_curriculum_period ADD CONSTRAINT period_organization_valid
 CHECK(organization IN ('PERIOD','ELECTIVES') AND (number IS NOT NULL OR organization='ELECTIVES'));
CREATE FUNCTION academic_period_organization() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 SELECT CASE WHEN attributes->>'organization'='ELECTIVES' THEN 'ELECTIVES' ELSE 'PERIOD' END
 INTO NEW.organization FROM academic_entry WHERE id=NEW.id;
 RETURN NEW;
END;
$$;
CREATE TRIGGER academic_period_organization_before BEFORE INSERT OR UPDATE ON academic_curriculum_period
 FOR EACH ROW EXECUTE FUNCTION academic_period_organization();
