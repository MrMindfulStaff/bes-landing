-- ============================================================================
-- 0031 — Admin broadcasts ("announce + email all members", like Skool's)
-- An admin announcement: creates a pinned community post, fans out an in-app
-- notification to every member, and records the broadcast. Emailing all members
-- is handled app-side (Resend) in the sendBroadcast server action. Throttling is
-- enforced app-side off this table's last created_at.
-- ============================================================================

create table if not exists broadcasts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references profiles(id) on delete set null,
  post_id         uuid references posts(id) on delete set null,
  title           text,
  body            text not null,
  recipient_count int not null default 0,
  email_count     int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists broadcasts_created_idx on broadcasts (created_at desc);

grant all on table broadcasts to anon, authenticated, service_role;
alter table broadcasts enable row level security;
create policy "broadcasts admin" on broadcasts for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Create an announcement: pinned post + in-app notification to every member.
-- Admin-only. Returns the new ids + how many members were notified.
create or replace function create_broadcast(p_title text, p_body text, p_pin boolean default true)
returns table (broadcast_id uuid, post_id uuid, recipients int)
language plpgsql security definer set search_path = public as $$
declare new_post uuid; b uuid; n int := 0; r record; t text; msg text;
begin
  if not is_admin(auth.uid()) then raise exception 'admin only'; end if;
  if coalesce(btrim(p_body), '') = '' then raise exception 'Message body is required'; end if;
  t := nullif(btrim(p_title), '');

  insert into posts (author_id, title, body, is_pinned)
    values (auth.uid(), t, p_body, coalesce(p_pin, true))
    returning id into new_post;

  msg := 'posted an announcement' || case when t is not null then ': ' || t else '' end;
  for r in select id from profiles where id <> auth.uid() loop
    perform notify(r.id, 'system', auth.uid(), msg, '/community');
    n := n + 1;
  end loop;

  insert into broadcasts (author_id, post_id, title, body, recipient_count)
    values (auth.uid(), new_post, t, p_body, n)
    returning id into b;

  return query select b, new_post, n;
end; $$;
grant execute on function create_broadcast(text, text, boolean) to authenticated;
