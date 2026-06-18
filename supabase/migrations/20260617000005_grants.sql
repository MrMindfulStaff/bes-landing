-- ============================================================================
-- 0005 — Role grants (CRITICAL)
-- Tables created via the SQL editor as `postgres` didn't pick up Supabase's
-- default privileges, so PostgREST returned "permission denied for table".
-- RLS still governs which ROWS each role sees; these grants govern table access.
-- This mirrors Supabase's standard default grant configuration.
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables    in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all functions in schema public to anon, authenticated, service_role;

-- Future objects too (note: ALTER DEFAULT PRIVILEGES uses FUNCTIONS, not ROUTINES)
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
