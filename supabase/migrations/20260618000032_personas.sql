-- ============================================================================
-- 0032 — AI member personas ("BES Mentors", disclosed)
-- Flags persona accounts so the UI can badge them and the activity engine can
-- identify them. Accounts/profiles are created out-of-band by
-- scripts/create-personas.mjs (service role).
-- ============================================================================

alter table profiles add column if not exists is_persona boolean not null default false;
create index if not exists profiles_is_persona_idx on profiles (is_persona) where is_persona;
