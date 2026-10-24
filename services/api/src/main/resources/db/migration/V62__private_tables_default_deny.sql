-- The Java service is the trusted table owner. Browsers never connect to PostgreSQL.
-- RLS denies direct access for non-owner/non-BYPASSRLS roles even if SELECT is
-- accidentally granted later. API ownership checks remain mandatory for the service.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT schemaname,tablename FROM pg_tables WHERE schemaname=current_schema()
    AND tablename <> 'flyway_schema_history'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC',t.schemaname,t.tablename);
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',t.schemaname,t.tablename);
  END LOOP;
  EXECUTE format('REVOKE CREATE ON SCHEMA %I FROM PUBLIC',current_schema());
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE ALL ON TABLES FROM PUBLIC',current_schema());
END $$;
