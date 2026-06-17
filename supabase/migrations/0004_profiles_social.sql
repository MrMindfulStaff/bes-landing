-- ============================================================================
-- 0004 — Richer profiles + follow graph (Facebook-style profile)
-- ============================================================================

alter table profiles add column if not exists location  text;
alter table profiles add column if not exists cover_url  text;
alter table profiles add column if not exists headline   text;   -- short tagline under name

-- ── Follow graph ────────────────────────────────────────────────────────────
create table if not exists follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);
create index if not exists follows_following_idx on follows (following_id);

alter table follows enable row level security;
create policy "follows read"       on follows for select to authenticated using (true);
create policy "follows manage own" on follows for all    to authenticated
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- Award points for being followed (social proof), once per follower.
create or replace function award_follow_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.following_id, 2, 'gained a follower');
  return new;
end; $$;
create trigger follows_award_points after insert on follows
  for each row execute function award_follow_points();
