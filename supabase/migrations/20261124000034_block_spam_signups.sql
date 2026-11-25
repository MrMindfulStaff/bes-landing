-- ============================================================================
-- 0034 — Block spam signups (24 Nov 2026).
-- Bots were creating accounts with random-string names ("olABVvxRPsvGmJGKBeSnCUY").
-- Signup goes straight from the browser to Supabase Auth, so the check lives on
-- auth.users itself: it stops the form and direct API calls alike.
--
-- A name is rejected when it is blank, or any part of it (split on spaces and
-- hyphens) is 12+ characters with 3+ capital letters after its first letter and
-- lowercase letters too. Real names like DeShawn, McDonald, LaShonDra, O'Neil or
-- JOHN SMITH pass; the random strings bots use do not.
-- ============================================================================

create or replace function public.is_spam_name(n text)
returns boolean language plpgsql immutable as $$
declare part text;
begin
  if n is null or length(trim(n)) < 2 then return true; end if;
  foreach part in array regexp_split_to_array(trim(n), '[\s\-]+') loop
    if length(part) >= 12
       and part ~ '[a-z]'
       and length(regexp_replace(substr(part, 2), '[^A-Z]', '', 'g')) >= 3 then
      return true;
    end if;
  end loop;
  return false;
end; $$;

create or replace function public.block_spam_signup()
returns trigger language plpgsql security definer set search_path = public as $$
declare n text;
begin
  n := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name');
  -- Email/password signups must carry a real name; OAuth names come from the provider.
  if coalesce(new.raw_app_meta_data->>'provider', 'email') = 'email' and public.is_spam_name(n) then
    raise exception 'Please sign up with your real name.' using errcode = 'check_violation';
  end if;
  return new;
end; $$;

drop trigger if exists block_spam_signup on auth.users;
create trigger block_spam_signup
  before insert on auth.users
  for each row execute function public.block_spam_signup();
