-- ============================================================================
-- 0035 — likes can be deleted again (24 Nov 2026).
-- likes has no primary key and is in the supabase_realtime publication, so
-- Postgres refused every DELETE on it: members could not unlike, and deleting
-- an account (which cascades to its likes) failed. REPLICA IDENTITY FULL lets
-- the publication identify deleted rows without a key.
-- ============================================================================
alter table public.likes replica identity full;
