-- Operator-run preparation, NOT a Flyway migration. Test in staging first.
-- This role trusts the Java backend; it does not implement per-student RLS.
-- Run as the migration owner. Assign a separate LOGIN role using the secret manager.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='enturma_runtime') THEN
    CREATE ROLE enturma_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='enturma_runtime' AND (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole)) THEN
    RAISE EXCEPTION 'Existing runtime role has unsafe attributes; inspect before proceeding';
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO enturma_runtime;
REVOKE CREATE ON SCHEMA public FROM enturma_runtime;
DO $$ DECLARE item record; BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'flyway_schema_history' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO enturma_runtime', item.tablename);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=item.tablename AND policyname='trusted_api_runtime') THEN
      EXECUTE format('CREATE POLICY trusted_api_runtime ON public.%I FOR ALL TO enturma_runtime USING (true) WITH CHECK (true)', item.tablename);
    END IF;
  END LOOP;
END $$;
GRANT SELECT ON public.flyway_schema_history TO enturma_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO enturma_runtime;
COMMIT;
-- Re-run after new tables are added; omission fails closed under RLS.
