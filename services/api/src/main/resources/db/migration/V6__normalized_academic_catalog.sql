-- Keep all existing identifiers and foreign keys: academic_entry becomes the compatibility projection.
CREATE FUNCTION academic_normalize(value text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
 SELECT trim(regexp_replace(translate(lower(coalesce(value,'')),
 'áàâãäåéèêëíìîïóòôõöúùûüçñ', 'aaaaaaeeeeiiiiooooouuuucn'), '[^a-z0-9]+', ' ', 'g'))
$$;
CREATE TABLE academic_source (
 id uuid PRIMARY KEY, institution_id uuid, provider varchar(60) NOT NULL,
 source_type varchar(30) NOT NULL CHECK(source_type IN ('EMEC','OFFICIAL_WEBPAGE','OFFICIAL_PDF','OFFICIAL_API','MANUAL_VERIFIED','CSV_IMPORT','JSON_IMPORT','OTHER')),
 source_name varchar(200) NOT NULL, source_url varchar(2000) NOT NULL,
 retrieved_at timestamptz NOT NULL DEFAULT now(), verified_at timestamptz, content_hash varchar(64),
 status varchar(25) NOT NULL CHECK(status IN ('VERIFIED','PENDING_VERIFICATION','OUTDATED','ARCHIVED','REJECTED')),
 metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,source_url,content_hash)
);
CREATE INDEX academic_source_provider ON academic_source(provider);
ALTER TABLE academic_entry ALTER name TYPE varchar(400);
ALTER TABLE academic_entry DROP CONSTRAINT academic_entry_status_check;
ALTER TABLE academic_entry ADD CHECK(status IN ('VERIFIED','PENDING_VERIFICATION','OUTDATED','ARCHIVED','REJECTED'));
ALTER TABLE academic_entry ADD provider varchar(60) NOT NULL DEFAULT 'LEGACY', ADD external_id varchar(240),
 ADD source_id uuid REFERENCES academic_source(id), ADD content_hash varchar(64),
 ADD attributes jsonb NOT NULL DEFAULT '{}', ADD created_at timestamptz NOT NULL DEFAULT now(), ADD updated_at timestamptz NOT NULL DEFAULT now(),
 ADD normalized_name text GENERATED ALWAYS AS (academic_normalize(name || ' ' || coalesce(code,'') || ' ' || coalesce(attributes->>'shortName','') || ' ' || coalesce(attributes->>'aliases',''))) STORED;
UPDATE academic_entry SET external_id=id::text;
ALTER TABLE academic_entry ALTER external_id SET NOT NULL;
CREATE UNIQUE INDEX academic_external_identity_unique ON academic_entry(provider,kind,external_id);
CREATE INDEX academic_normalized_name ON academic_entry(normalized_name text_pattern_ops);
CREATE TABLE academic_institution (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), emec_code varchar(40) UNIQUE, name varchar(200) NOT NULL,
 legal_name varchar(300), short_name varchar(80), slug varchar(260) NOT NULL UNIQUE, normalized_name text NOT NULL,
 type varchar(60), category varchar(60), organization_type varchar(60), city varchar(150), state varchar(2), country varchar(2) DEFAULT 'BR',
 website_url varchar(2000), active boolean NOT NULL DEFAULT true, status varchar(25) NOT NULL,
 source_id uuid REFERENCES academic_source(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academic_source ADD FOREIGN KEY(institution_id) REFERENCES academic_institution(id);
CREATE INDEX institution_normalized_name ON academic_institution(normalized_name text_pattern_ops);
CREATE TABLE academic_campus (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), institution_id uuid NOT NULL REFERENCES academic_institution(id),
 external_code varchar(80), name varchar(200) NOT NULL, slug varchar(260) NOT NULL, address_label varchar(500), city varchar(150), state varchar(2),
 latitude numeric(10,7) CHECK(latitude BETWEEN -90 AND 90), longitude numeric(10,7) CHECK(longitude BETWEEN -180 AND 180),
 active boolean NOT NULL DEFAULT true, source_id uuid REFERENCES academic_source(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,institution_id), UNIQUE(institution_id,slug)
);
CREATE INDEX campus_institution ON academic_campus(institution_id);
CREATE TABLE academic_course (
 id uuid PRIMARY KEY, name varchar(200) NOT NULL, normalized_name text NOT NULL, slug varchar(260) NOT NULL UNIQUE,
 degree_type varchar(20) NOT NULL DEFAULT 'OTHER' CHECK(degree_type IN ('BACHELOR','TECHNOLOGIST','LICENTIATE','SEQUENTIAL','OTHER')),
 knowledge_area varchar(200), active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX course_normalized_name ON academic_course(normalized_name text_pattern_ops);
CREATE TABLE academic_course_offering (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), institution_id uuid NOT NULL REFERENCES academic_institution(id),
 campus_id uuid NOT NULL, course_id uuid NOT NULL REFERENCES academic_course(id), emec_course_code varchar(40),
 modality varchar(20) CHECK(modality IN ('PRESENTIAL','REMOTE','HYBRID')), shift varchar(20) CHECK(shift IN ('MORNING','AFTERNOON','EVENING','FULL_TIME','REMOTE','VARIABLE')),
 duration_periods int CHECK(duration_periods>0), duration_months int CHECK(duration_months>0), active boolean NOT NULL DEFAULT true, status varchar(25) NOT NULL,
 source_id uuid REFERENCES academic_source(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(campus_id,institution_id) REFERENCES academic_campus(id,institution_id)
);
CREATE INDEX offering_institution ON academic_course_offering(institution_id);
CREATE INDEX offering_campus ON academic_course_offering(campus_id);
CREATE INDEX offering_emec ON academic_course_offering(emec_course_code);
CREATE UNIQUE INDEX offering_emec_identity ON academic_course_offering(institution_id,campus_id,emec_course_code,modality,shift) WHERE emec_course_code IS NOT NULL;
CREATE TABLE academic_curriculum (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), course_offering_id uuid NOT NULL REFERENCES academic_course_offering(id), name varchar(200) NOT NULL,
 version varchar(80) NOT NULL, effective_year int, effective_semester int CHECK(effective_semester IN (1,2)),
 valid_from date, valid_until date, total_workload_hours int CHECK(total_workload_hours>0), minimum_periods int CHECK(minimum_periods>0),
 source_id uuid REFERENCES academic_source(id), verification_status varchar(25) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(course_offering_id,version)
);
CREATE INDEX curriculum_offering ON academic_curriculum(course_offering_id);
CREATE TABLE academic_curriculum_period (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), curriculum_id uuid NOT NULL REFERENCES academic_curriculum(id), number int NOT NULL, name varchar(200) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,curriculum_id), UNIQUE(curriculum_id,number)
);
CREATE INDEX period_curriculum ON academic_curriculum_period(curriculum_id);
CREATE TABLE academic_subject (
 id uuid PRIMARY KEY, name varchar(400) NOT NULL, normalized_name text NOT NULL, slug varchar(500) NOT NULL UNIQUE,
 canonical_code varchar(80), description text, default_workload_hours int CHECK(default_workload_hours>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subject_normalized_name ON academic_subject(normalized_name text_pattern_ops);
CREATE TABLE academic_curriculum_subject (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), curriculum_id uuid NOT NULL REFERENCES academic_curriculum(id), period_id uuid NOT NULL,
 subject_id uuid NOT NULL REFERENCES academic_subject(id), institution_subject_code varchar(80), display_name varchar(400) NOT NULL,
 workload_hours int CHECK(workload_hours>0), required boolean NOT NULL DEFAULT true, order_index int NOT NULL DEFAULT 0,
 source_id uuid REFERENCES academic_source(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(period_id,curriculum_id) REFERENCES academic_curriculum_period(id,curriculum_id), UNIQUE(id,curriculum_id)
);
CREATE INDEX curriculum_subject_curriculum ON academic_curriculum_subject(curriculum_id);
CREATE INDEX curriculum_subject_period ON academic_curriculum_subject(period_id,order_index);
CREATE INDEX curriculum_subject_subject ON academic_curriculum_subject(subject_id);
CREATE TABLE academic_subject_topic (
 id uuid PRIMARY KEY REFERENCES academic_entry(id), subject_id uuid NOT NULL REFERENCES academic_subject(id), name varchar(200) NOT NULL,
 normalized_name text NOT NULL, order_index int NOT NULL DEFAULT 0, source_id uuid REFERENCES academic_source(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE academic_subject_prerequisite (
 curriculum_subject_id uuid NOT NULL, prerequisite_id uuid NOT NULL, curriculum_id uuid NOT NULL, source_id uuid NOT NULL REFERENCES academic_source(id),
 PRIMARY KEY(curriculum_subject_id,prerequisite_id), CHECK(curriculum_subject_id<>prerequisite_id),
 FOREIGN KEY(curriculum_subject_id,curriculum_id) REFERENCES academic_curriculum_subject(id,curriculum_id),
 FOREIGN KEY(prerequisite_id,curriculum_id) REFERENCES academic_curriculum_subject(id,curriculum_id)
);
CREATE TABLE academic_import_job (
 id uuid PRIMARY KEY, provider varchar(60) NOT NULL, institution_id uuid REFERENCES academic_institution(id), type varchar(40) NOT NULL,
 status varchar(30) NOT NULL CHECK(status IN ('PENDING','RUNNING','PAUSED','COMPLETED','COMPLETED_WITH_ERRORS','FAILED','CANCELLED')),
 started_at timestamptz, completed_at timestamptz, total_items int NOT NULL DEFAULT 0, processed_items int NOT NULL DEFAULT 0,
 success_items int NOT NULL DEFAULT 0, failed_items int NOT NULL DEFAULT 0, skipped_items int NOT NULL DEFAULT 0,
 error_message varchar(1000), requested_by uuid REFERENCES app_user(id), request_id varchar(100),
 seed_key varchar(200) UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX import_job_status ON academic_import_job(status,created_at);
CREATE TABLE academic_import_item (
 id uuid PRIMARY KEY, job_id uuid NOT NULL REFERENCES academic_import_job(id), ordinal int NOT NULL, entity_type varchar(25) NOT NULL,
 external_id varchar(240) NOT NULL, entity_id uuid, status varchar(30) NOT NULL DEFAULT 'PENDING', source_url varchar(2000) NOT NULL,
 content_hash varchar(64) NOT NULL, payload jsonb NOT NULL, error_code varchar(60), error_message varchar(1000),
 created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz, UNIQUE(job_id,ordinal)
);
CREATE INDEX import_item_pending ON academic_import_item(job_id,status,ordinal);
CREATE TABLE academic_catalog_audit (
 id uuid PRIMARY KEY, actor_id uuid REFERENCES app_user(id), action varchar(80) NOT NULL, entity_type varchar(30) NOT NULL, entity_id uuid,
 source_id uuid REFERENCES academic_source(id), before_value jsonb, after_value jsonb, request_id varchar(100), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_audit_entity ON academic_catalog_audit(entity_id,created_at DESC);
CREATE FUNCTION academic_prepare_entry() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 NEW.external_id:=coalesce(NEW.external_id,NEW.id::text);NEW.updated_at:=now();RETURN NEW;
END $$;
CREATE TABLE academic_catalog_request (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), institution_id uuid NOT NULL REFERENCES academic_institution(id),
 course_offering_id uuid NOT NULL REFERENCES academic_course_offering(id), requested_at timestamptz NOT NULL DEFAULT now(),
 status varchar(20) NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','IN_REVIEW','AVAILABLE','CLOSED')), UNIQUE(user_id,course_offering_id)
);
CREATE INDEX catalog_request_priority ON academic_catalog_request(status,course_offering_id);
CREATE TABLE academic_domain_event (
 id uuid PRIMARY KEY, type varchar(60) NOT NULL, job_id uuid REFERENCES academic_import_job(id), entity_id uuid, provider varchar(60),
 payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE academic_migration_report (
 kind varchar(25) PRIMARY KEY, legacy_count bigint NOT NULL, migrated_count bigint NOT NULL, skipped_count bigint NOT NULL DEFAULT 0,
 failed_count bigint NOT NULL DEFAULT 0, migrated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER academic_entry_defaults BEFORE INSERT OR UPDATE ON academic_entry FOR EACH ROW EXECUTE FUNCTION academic_prepare_entry();

-- Both legacy administrative imports and new provider imports write this transactional projection.
CREATE FUNCTION academic_sync_normalized() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a jsonb:=NEW.attributes; concept uuid; institution uuid; curriculum uuid; parent_subject uuid; source uuid; slug_value text;
BEGIN
 slug_value:=replace(academic_normalize(NEW.name),' ','-')||'-'||NEW.id::text;
 source:=NEW.source_id;
 IF source IS NULL THEN
   source:=NEW.id;
   INSERT INTO academic_source(id,provider,source_type,source_name,source_url,verified_at,status)
   VALUES(source,NEW.provider,'MANUAL_VERIFIED',NEW.source_name,NEW.source_url,NEW.verified_at,NEW.status)
   ON CONFLICT(id) DO UPDATE SET source_name=EXCLUDED.source_name,source_url=EXCLUDED.source_url,verified_at=EXCLUDED.verified_at,status=EXCLUDED.status,updated_at=now();
 END IF;
 IF NEW.kind='INSTITUTION' THEN
  INSERT INTO academic_institution(id,emec_code,name,legal_name,short_name,slug,normalized_name,type,category,organization_type,city,state,country,website_url,active,status,source_id)
  VALUES(NEW.id,a->>'emecCode',NEW.name,a->>'legalName',a->>'shortName',slug_value,academic_normalize(NEW.name),a->>'type',a->>'category',a->>'organizationType',a->>'city',a->>'state',coalesce(a->>'country','BR'),a->>'websiteUrl',NEW.status NOT IN ('ARCHIVED','REJECTED'),NEW.status,source)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,normalized_name=EXCLUDED.normalized_name,emec_code=EXCLUDED.emec_code,legal_name=EXCLUDED.legal_name,short_name=EXCLUDED.short_name,type=EXCLUDED.type,category=EXCLUDED.category,organization_type=EXCLUDED.organization_type,city=EXCLUDED.city,state=EXCLUDED.state,website_url=EXCLUDED.website_url,active=EXCLUDED.active,status=EXCLUDED.status,source_id=source,updated_at=now();
 ELSIF NEW.kind='CAMPUS' THEN
  INSERT INTO academic_campus(id,institution_id,external_code,name,slug,address_label,city,state,latitude,longitude,active,source_id)
  VALUES(NEW.id,NEW.parent_id,NEW.code,NEW.name,slug_value,a->>'addressLabel',a->>'city',a->>'state',(a->>'latitude')::numeric,(a->>'longitude')::numeric,NEW.status NOT IN ('ARCHIVED','REJECTED'),source)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,address_label=EXCLUDED.address_label,city=EXCLUDED.city,state=EXCLUDED.state,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,active=EXCLUDED.active,source_id=source,updated_at=now();
 ELSIF NEW.kind='COURSE' THEN
  concept:=coalesce((a->>'courseId')::uuid,NEW.id);
  INSERT INTO academic_course(id,name,normalized_name,slug,degree_type,knowledge_area)
  VALUES(concept,NEW.name,academic_normalize(NEW.name),slug_value,coalesce(a->>'degreeType','OTHER'),a->>'knowledgeArea') ON CONFLICT(id) DO NOTHING;
  SELECT institution_id INTO institution FROM academic_campus WHERE id=NEW.parent_id;
  INSERT INTO academic_course_offering(id,institution_id,campus_id,course_id,emec_course_code,modality,shift,duration_periods,duration_months,active,status,source_id)
  VALUES(NEW.id,institution,NEW.parent_id,concept,a->>'emecCourseCode',a->>'modality',a->>'shift',(a->>'durationPeriods')::int,(a->>'durationMonths')::int,NEW.status NOT IN ('ARCHIVED','REJECTED'),NEW.status,source)
  ON CONFLICT(id) DO UPDATE SET emec_course_code=EXCLUDED.emec_course_code,modality=EXCLUDED.modality,shift=EXCLUDED.shift,duration_periods=EXCLUDED.duration_periods,duration_months=EXCLUDED.duration_months,active=EXCLUDED.active,status=EXCLUDED.status,source_id=source,updated_at=now();
 ELSIF NEW.kind='CURRICULUM' THEN
  INSERT INTO academic_curriculum(id,course_offering_id,name,version,effective_year,effective_semester,valid_from,valid_until,total_workload_hours,minimum_periods,source_id,verification_status)
  VALUES(NEW.id,NEW.parent_id,NEW.name,coalesce(NEW.curriculum_version,NEW.code,NEW.id::text),(a->>'effectiveYear')::int,(a->>'effectiveSemester')::int,NEW.valid_from,NEW.valid_until,(a->>'totalWorkloadHours')::int,(a->>'minimumPeriods')::int,source,NEW.status)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,verification_status=EXCLUDED.verification_status,source_id=source,updated_at=now();
 ELSIF NEW.kind='PERIOD' THEN
  INSERT INTO academic_curriculum_period(id,curriculum_id,number,name) VALUES(NEW.id,NEW.parent_id,NEW.period_number,NEW.name)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name;
 ELSIF NEW.kind='SUBJECT' THEN
  concept:=coalesce((a->>'subjectId')::uuid,NEW.id);
  INSERT INTO academic_subject(id,name,normalized_name,slug,canonical_code,description,default_workload_hours)
  VALUES(concept,NEW.name,academic_normalize(NEW.name),slug_value,NEW.code,a->>'description',(a->>'workloadHours')::int) ON CONFLICT(id) DO NOTHING;
  SELECT curriculum_id INTO curriculum FROM academic_curriculum_period WHERE id=NEW.parent_id;
  INSERT INTO academic_curriculum_subject(id,curriculum_id,period_id,subject_id,institution_subject_code,display_name,workload_hours,required,order_index,source_id)
  VALUES(NEW.id,curriculum,NEW.parent_id,concept,NEW.code,NEW.name,(a->>'workloadHours')::int,coalesce((a->>'required')::boolean,true),coalesce((a->>'orderIndex')::int,0),source)
  ON CONFLICT(id) DO UPDATE SET display_name=EXCLUDED.display_name,workload_hours=EXCLUDED.workload_hours,required=EXCLUDED.required,order_index=EXCLUDED.order_index,source_id=source,updated_at=now();
 ELSIF NEW.kind='TOPIC' THEN
  SELECT subject_id INTO parent_subject FROM academic_curriculum_subject WHERE id=NEW.parent_id;
  INSERT INTO academic_subject_topic(id,subject_id,name,normalized_name,order_index,source_id)
  VALUES(NEW.id,parent_subject,NEW.name,academic_normalize(NEW.name),coalesce((a->>'orderIndex')::int,0),source)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,normalized_name=EXCLUDED.normalized_name,order_index=EXCLUDED.order_index,source_id=source;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER academic_normalized_projection AFTER INSERT OR UPDATE ON academic_entry FOR EACH ROW EXECUTE FUNCTION academic_sync_normalized();
DO $$ DECLARE kind_name text; BEGIN
 FOREACH kind_name IN ARRAY ARRAY['INSTITUTION','CAMPUS','COURSE','CURRICULUM','PERIOD','SUBJECT','TOPIC'] LOOP
  UPDATE academic_entry SET updated_at=now() WHERE kind=kind_name;
 END LOOP;
END $$;
INSERT INTO academic_migration_report(kind,legacy_count,migrated_count)
 SELECT kind,count(*),count(*) FROM academic_entry GROUP BY kind;
ALTER TABLE academic_enrollment ADD course_offering_id uuid REFERENCES academic_course_offering(id), ADD curriculum_id uuid REFERENCES academic_curriculum(id);
UPDATE academic_enrollment e SET curriculum_id=p.curriculum_id,course_offering_id=c.course_offering_id
 FROM academic_curriculum_period p JOIN academic_curriculum c ON c.id=p.curriculum_id WHERE p.id=e.period_id;
ALTER TABLE academic_enrollment ALTER course_offering_id SET NOT NULL, ALTER curriculum_id SET NOT NULL;
ALTER TABLE academic_enrollment ADD FOREIGN KEY(period_id,curriculum_id) REFERENCES academic_curriculum_period(id,curriculum_id);
ALTER TABLE user_subject ADD FOREIGN KEY(subject_id) REFERENCES academic_curriculum_subject(id);
ALTER TABLE study_room ADD canonical_subject_id uuid REFERENCES academic_subject(id), ADD scope varchar(20) NOT NULL DEFAULT 'CURRICULUM' CHECK(scope IN ('CURRICULUM','GLOBAL'));
UPDATE study_room r SET canonical_subject_id=s.subject_id FROM academic_curriculum_subject s WHERE s.id=r.subject_id;
ALTER TABLE study_room ALTER canonical_subject_id SET NOT NULL;
ALTER TABLE study_room ADD FOREIGN KEY(subject_id) REFERENCES academic_curriculum_subject(id);
CREATE FUNCTION academic_room_context() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 SELECT subject_id INTO NEW.canonical_subject_id FROM academic_curriculum_subject WHERE id=NEW.subject_id;RETURN NEW;
END $$;
CREATE TRIGGER study_room_academic_context BEFORE INSERT OR UPDATE OF subject_id ON study_room FOR EACH ROW EXECUTE FUNCTION academic_room_context();
CREATE TABLE academic_enrollment_history (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES app_user(id), course_offering_id uuid NOT NULL REFERENCES academic_course_offering(id), curriculum_id uuid NOT NULL REFERENCES academic_curriculum(id),
 period_id uuid NOT NULL REFERENCES academic_curriculum_period(id), subjects jsonb NOT NULL, changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enrollment_history_user ON academic_enrollment_history(user_id,changed_at DESC);
CREATE FUNCTION academic_enrollment_context() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 SELECT p.curriculum_id,c.course_offering_id INTO NEW.curriculum_id,NEW.course_offering_id FROM academic_curriculum_period p JOIN academic_curriculum c ON c.id=p.curriculum_id WHERE p.id=NEW.period_id;
 IF TG_OP='UPDATE' AND OLD.period_id<>NEW.period_id THEN
 INSERT INTO academic_enrollment_history(id,user_id,course_offering_id,curriculum_id,period_id,subjects)
 VALUES(gen_random_uuid(),OLD.user_id,OLD.course_offering_id,OLD.curriculum_id,OLD.period_id,coalesce((SELECT jsonb_agg(subject_id) FROM user_subject WHERE user_id=OLD.user_id),'[]'));
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER enrollment_academic_context BEFORE INSERT OR UPDATE ON academic_enrollment FOR EACH ROW EXECUTE FUNCTION academic_enrollment_context();
CREATE VIEW academic_external_identity AS SELECT provider,kind entity_type,external_id,id entity_id FROM academic_entry;
