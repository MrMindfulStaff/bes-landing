-- ============================================================================
-- 0023 — Gamification engine: Founder Ascension levels, XP sources, streaks,
--        rolling leaderboards. All XP awarded server-side.
-- ============================================================================

-- ── Levels (Founder Ascension) ──────────────────────────────────────────────
create table if not exists levels (
  level  int primary key,
  name   text not null,
  min_xp int not null
);
grant all on table levels to anon, authenticated, service_role;
alter table levels enable row level security;
create policy "levels read" on levels for select to authenticated using (true);

insert into levels (level, name, min_xp) values
  (1,'Newcomer',0),(2,'Hustler',75),(3,'Builder',200),(4,'Operator',450),
  (5,'Strategist',900),(6,'Closer',1700),(7,'Boss',3000),(8,'Mogul',5500),(9,'Legacy',10000)
on conflict (level) do update set name = excluded.name, min_xp = excluded.min_xp;

create or replace function level_for_xp(xp int)
returns int language sql immutable set search_path = public as $$
  select coalesce(max(level), 1) from levels where min_xp <= greatest(xp, 0);
$$;

-- ── Rewrite award_points to use threshold levels (was sqrt) ──────────────────
create or replace function award_points(uid uuid, pts integer, why text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into points_log(user_id, amount, reason) values (uid, pts, why);
  update profiles set points = greatest(points + pts, 0) where id = uid;
  update profiles set level = level_for_xp(points) where id = uid;
end; $$;

-- ── XP: likes on your content (recognition) ─────────────────────────────────
create or replace function award_like_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid; pts int;
begin
  if tg_op = 'INSERT' then
    if new.post_id is not null then select author_id into author from posts where id = new.post_id; pts := 2;
    else select author_id into author from comments where id = new.comment_id; pts := 1; end if;
    if author is not null and author <> new.user_id then perform award_points(author, pts, 'content liked'); end if;
  elsif tg_op = 'DELETE' then
    if old.post_id is not null then select author_id into author from posts where id = old.post_id; pts := -2;
    else select author_id into author from comments where id = old.comment_id; pts := -1; end if;
    if author is not null and author <> old.user_id then perform award_points(author, pts, 'like removed'); end if;
  end if;
  return null;
end; $$;
drop trigger if exists likes_award on likes;
create trigger likes_award after insert or delete on likes for each row execute function award_like_points();

-- ── XP: lesson completion (+15) and full course completion (+100) ───────────
create or replace function award_lesson_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid; total int; done int;
begin
  if tg_op = 'INSERT' then
    perform award_points(new.user_id, 15, 'lesson completed');
    select c.id into cid from lessons l join modules m on m.id = l.module_id join courses c on c.id = m.course_id where l.id = new.lesson_id;
    select count(*) into total from lessons l join modules m on m.id = l.module_id where m.course_id = cid and l.is_published;
    select count(*) into done from lesson_progress lp join lessons l on l.id = lp.lesson_id join modules m on m.id = l.module_id
       where m.course_id = cid and lp.user_id = new.user_id and l.is_published;
    if total > 0 and done >= total and not exists (
       select 1 from points_log where user_id = new.user_id and reason = 'course completed:' || cid) then
      perform award_points(new.user_id, 100, 'course completed:' || cid);
    end if;
  elsif tg_op = 'DELETE' then
    perform award_points(old.user_id, -15, 'lesson uncompleted');
  end if;
  return null;
end; $$;
drop trigger if exists lesson_progress_award on lesson_progress;
create trigger lesson_progress_award after insert or delete on lesson_progress for each row execute function award_lesson_points();

-- ── XP: profile completion (+25 once) ───────────────────────────────────────
create or replace function award_profile_completion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.avatar_url is not null and new.bio is not null and new.industry is not null
     and not exists (select 1 from points_log where user_id = new.id and reason = 'profile completed') then
    perform award_points(new.id, 25, 'profile completed');
  end if;
  return new;
end; $$;
drop trigger if exists profiles_completion on profiles;
create trigger profiles_completion after update on profiles for each row
  when (new.avatar_url is not null and new.bio is not null and new.industry is not null)
  execute function award_profile_completion();

-- ── XP: referral joined (+50 to referrer) ───────────────────────────────────
create or replace function award_referral()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referred_by is not null and (tg_op = 'INSERT' or old.referred_by is null) then
    perform award_points(new.referred_by, 50, 'referral joined');
  end if;
  return new;
end; $$;
drop trigger if exists profiles_referral on profiles;
create trigger profiles_referral after insert or update of referred_by on profiles for each row execute function award_referral();

-- ── Daily streaks (+5/day, +20 at 7, +50 at 30) ─────────────────────────────
alter table profiles add column if not exists streak_days int not null default 0;
alter table profiles add column if not exists streak_last date;

create or replace function touch_streak()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid; last_d date; cur int;
begin
  uid := auth.uid();
  if uid is null then return; end if;
  update profiles set last_active_at = now() where id = uid;
  select streak_last, streak_days into last_d, cur from profiles where id = uid;
  if last_d = current_date then return; end if;          -- already counted today
  if last_d = current_date - 1 then cur := cur + 1; else cur := 1; end if;
  update profiles set streak_days = cur, streak_last = current_date where id = uid;
  perform award_points(uid, 5, 'daily streak');
  if cur = 7 then perform award_points(uid, 20, '7-day streak bonus'); end if;
  if cur = 30 then perform award_points(uid, 50, '30-day streak bonus'); end if;
end; $$;
grant execute on function touch_streak() to authenticated;

-- ── Leaderboard RPC (all-time / 30-day / 7-day) — bypasses points_log RLS ───
create or replace function leaderboard(days int default 0, lim int default 100)
returns table (id uuid, full_name text, avatar_url text, industry text, level int, xp bigint)
language sql security definer set search_path = public as $$
  select p.id, p.full_name, p.avatar_url, p.industry, p.level,
    case when days <= 0 then p.points::bigint
         else coalesce((select sum(amount) from points_log pl
                        where pl.user_id = p.id and pl.created_at >= now() - (days || ' days')::interval), 0)
    end as xp
  from profiles p
  order by xp desc
  limit lim;
$$;
grant execute on function leaderboard(int, int) to authenticated;

-- ── Recompute levels for existing members under the new ladder ──────────────
update profiles set level = level_for_xp(points);
