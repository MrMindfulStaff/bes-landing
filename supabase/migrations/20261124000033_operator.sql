-- ============================================================================
-- 0033 — Operator: the bot that runs BES as Reginald, on his own account.
-- Settings row (admin-editable kill switch + per-action toggles) and a
-- service-role-only DM helper so the operator can open a 1:1 thread as him.
-- Every operator action is logged to automation_log with actor = 'operator'.
-- ============================================================================

create table if not exists operator_settings (
  id           int primary key default 1 check (id = 1),
  enabled      boolean not null default true,
  welcomes     boolean not null default true,
  replies      boolean not null default true,
  nudges       boolean not null default true,
  milestones   boolean not null default true,
  weekly_posts boolean not null default true,
  daily_dm_cap int not null default 6,
  updated_at   timestamptz not null default now()
);
insert into operator_settings (id) values (1) on conflict (id) do nothing;

grant all on table operator_settings to authenticated, service_role;
alter table operator_settings enable row level security;
drop policy if exists "operator admin read" on operator_settings;
create policy "operator admin read" on operator_settings for select to authenticated
  using (is_admin(auth.uid()));
drop policy if exists "operator admin write" on operator_settings;
create policy "operator admin write" on operator_settings for update to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- (Admins already read automation_log via the "automation admin" policy from 0001.)

-- 1:1 DM between two given users (the operator acts as `sender`). Service role only.
create or replace function operator_dm(sender uuid, other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare conv uuid;
begin
  if sender is null or other is null or sender = other then raise exception 'invalid dm target'; end if;
  select c.id into conv from conversations c
   where c.is_group = false
     and exists (select 1 from conversation_participants p where p.conversation_id = c.id and p.user_id = sender)
     and exists (select 1 from conversation_participants p where p.conversation_id = c.id and p.user_id = other)
     and (select count(*) from conversation_participants p where p.conversation_id = c.id) = 2
   limit 1;
  if conv is not null then return conv; end if;
  insert into conversations (is_group) values (false) returning id into conv;
  insert into conversation_participants (conversation_id, user_id) values (conv, sender), (conv, other);
  return conv;
end; $$;
revoke all on function operator_dm(uuid, uuid) from public, anon, authenticated;
grant execute on function operator_dm(uuid, uuid) to service_role;
