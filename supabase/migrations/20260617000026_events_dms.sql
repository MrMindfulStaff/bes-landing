-- ============================================================================
-- 0026 — Events RSVP visibility + Direct Messages plumbing
-- (events, event_rsvps, conversations, conversation_participants, messages
--  tables + base RLS already exist from 0001.)
-- ============================================================================

-- Members can see everyone's RSVPs (for attendee counts/avatars).
create policy "rsvp read" on event_rsvps for select to authenticated
  using (is_active_member(auth.uid()));

-- Find an existing 1:1 conversation between the caller and `other`, or create one.
-- SECURITY DEFINER because conversation/participant inserts are otherwise locked down.
create or replace function get_or_create_dm(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid; conv uuid;
begin
  me := auth.uid();
  if me is null or other is null or me = other then raise exception 'invalid dm target'; end if;

  select c.id into conv from conversations c
   where c.is_group = false
     and exists (select 1 from conversation_participants p where p.conversation_id = c.id and p.user_id = me)
     and exists (select 1 from conversation_participants p where p.conversation_id = c.id and p.user_id = other)
     and (select count(*) from conversation_participants p where p.conversation_id = c.id) = 2
   limit 1;
  if conv is not null then return conv; end if;

  insert into conversations (is_group) values (false) returning id into conv;
  insert into conversation_participants (conversation_id, user_id) values (conv, me), (conv, other);
  return conv;
end; $$;
grant execute on function get_or_create_dm(uuid) to authenticated;

-- Notify other participants on a new message (collapses to one unread per thread).
create or replace function notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record;
begin
  for p in select user_id from conversation_participants
            where conversation_id = new.conversation_id and user_id <> new.sender_id loop
    if not exists (
      select 1 from notifications
       where user_id = p.user_id and type = 'dm' and read_at is null
         and data->>'href' = '/messages/' || new.conversation_id
    ) then
      perform notify(p.user_id, 'dm', new.sender_id, 'sent you a message', '/messages/' || new.conversation_id);
    end if;
  end loop;
  return null;
end; $$;
drop trigger if exists messages_notify on messages;
create trigger messages_notify after insert on messages for each row execute function notify_on_message();

-- Messages drive conversation ordering; make sure realtime is on (idempotent).
do $$ begin
  begin execute 'alter publication supabase_realtime add table messages'; exception when duplicate_object then null; end;
end $$;
