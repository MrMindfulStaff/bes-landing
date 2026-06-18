-- ============================================================================
-- 0030 — Skool member import staging + auto-enrichment on signup
-- Holds the 45 migrated Skool members' bios. When a member self-signs-up, a
-- trigger matches them (by email, else by normalized name) and fills their
-- profile bio/location from the staged data. Data is loaded out-of-band by
-- scripts/load-skool-imports.mjs (emails stay out of git).
-- ============================================================================

create table if not exists skool_imports (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  name_key        text not null,          -- lower(), alphanumerics only — for matching
  email           text,                   -- only the 6 Skool exposed
  bio             text,
  location        text,
  handle          text,
  joined          text,
  source          text,
  applied_at      timestamptz,
  applied_user_id uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists skool_imports_name_key on skool_imports (name_key);
create index if not exists skool_imports_email_idx on skool_imports (email);

grant all on table skool_imports to anon, authenticated, service_role;
alter table skool_imports enable row level security;
create policy "skool_imports admin" on skool_imports for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- On new profile, pull a matching staged Skool bio (once) and apply where empty.
create or replace function apply_skool_import()
returns trigger language plpgsql security definer set search_path = public as $$
declare imp record; uemail text; nkey text;
begin
  nkey := regexp_replace(lower(coalesce(new.full_name, '')), '[^a-z0-9]', '', 'g');
  select lower(email) into uemail from auth.users where id = new.id;

  select * into imp from skool_imports
   where applied_at is null
     and ( (uemail is not null and lower(email) = uemail)
           or (nkey <> '' and name_key = nkey) )
   order by (uemail is not null and lower(email) = uemail) desc   -- prefer email match
   limit 1;
  if not found then return new; end if;

  update profiles set
    bio      = coalesce(nullif(bio, ''), nullif(imp.bio, '')),
    location = coalesce(nullif(location, ''), nullif(imp.location, ''))
  where id = new.id;

  update skool_imports set applied_at = now(), applied_user_id = new.id where id = imp.id;
  return new;
end; $$;

drop trigger if exists profiles_apply_skool_import on profiles;
create trigger profiles_apply_skool_import after insert on profiles
  for each row execute function apply_skool_import();
