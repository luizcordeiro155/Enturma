#!/usr/bin/env bash
set -euo pipefail
# Only the disposable GitHub Actions database; never accepts a production URL.
[[ "${CI:-}" == "true" && "${PGHOST:-}" == "127.0.0.1" && "${PGDATABASE:-}" == "enturma_test" ]] || { echo 'Restore rehearsal restricted to isolated CI'; exit 1; }
target=enturma_restore_verify
snapshot=$(mktemp)
created=false
cleanup() {
  if [[ "$created" == true ]]; then dropdb --if-exists "$target"; fi
  rm -f "$snapshot"
}
trap cleanup EXIT
started=$SECONDS
pg_dump --format=custom --no-owner --no-acl --file="$snapshot" "$PGDATABASE"
createdb "$target"
created=true
pg_restore --exit-on-error --no-owner --no-acl --dbname="$target" "$snapshot"
query="SELECT format('SELECT %L AS name,count(*) FROM %I.%I;',tablename,schemaname,tablename) FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
counts() { psql -XAt -d "$1" -c "$query" | psql -XAt -d "$1"; }
[[ "$(counts "$PGDATABASE")" == "$(counts "$target")" ]] || { echo 'Restored row counts differ'; exit 1; }
[[ "$(psql -XAt -d "$target" -c "SELECT count(*) FROM flyway_schema_history WHERE NOT success")" == 0 ]] || exit 1
psql -X -v ON_ERROR_STOP=1 -d "$target" -f deploy/postgres-runtime-role.sql
psql -X -v ON_ERROR_STOP=1 -d "$target" <<'SQL'
BEGIN;
SET LOCAL ROLE enturma_runtime;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole)) THEN
    RAISE EXCEPTION 'Unsafe runtime attributes';
  END IF;
  IF has_schema_privilege(current_user,'public','CREATE') THEN RAISE EXCEPTION 'Runtime can create schema objects'; END IF;
  IF has_table_privilege(current_user,'public.app_user','TRUNCATE') THEN RAISE EXCEPTION 'Runtime can truncate users'; END IF;
END $$;
SELECT count(*) FROM app_user;
INSERT INTO rate_limit(bucket,hits,resets_at) VALUES ('restore-runtime-probe',1,now()+interval '1 hour');
ROLLBACK;
SQL
mkdir -p dist/security
printf '{"scope":"synthetic CI database only","rowCountsMatch":true,"flywaySuccess":true,"runtimeRoleProbe":true,"elapsedSeconds":%s,"productionBackupVerified":false}\n' "$((SECONDS-started))" > dist/security/restore-rehearsal.json
echo 'Synthetic database restored and row counts verified. This is not proof of a production backup.'
