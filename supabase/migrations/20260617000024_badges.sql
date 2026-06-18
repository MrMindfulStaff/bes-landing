-- ============================================================================
-- 0024 — Achievement badges. Granted server-side from data we already track.
-- ============================================================================

create table if not exists badges (
  slug        text primary key,
  name        text not null,
  description text not null,
  icon        text not null,
  sort_order  int not null default 0
);
grant all on table badges to anon, authenticated, service_role;
alter table badges enable row level security;
create policy "badges read" on badges for select to authenticated using (true);

insert into badges (slug, name, description, icon, sort_order) values
  ('welcome','Welcome to BES','Joined the Society.','👋',1),
  ('all-set','All Set','Completed your profile.','✅',2),
  ('first-post','First Word','Published your first post.','💬',3),
  ('conversationalist','Conversationalist','Published 10 posts.','🗣️',4),
  ('well-liked','Well Liked','Earned 25 likes on your content.','❤️',5),
  ('connector','Connector','Reached 10 followers.','🤝',6),
  ('first-lesson','Getting Started','Completed your first lesson.','📖',7),
  ('course-complete','Course Complete','Finished an entire course.','🎓',8),
  ('scholar','Scholar','Finished 3 courses.','📚',9),
  ('graduate','BES Graduate','Finished all 12 courses.','🏆',10),
  ('on-fire','On Fire','Reached a 7-day streak.','🔥',11),
  ('unstoppable','Unstoppable','Reached a 30-day streak.','⚡',12),
  ('recruiter','Recruiter','Referred a member who joined.','📣',13)
on conflict (slug) do update set name=excluded.name, description=excluded.description, icon=excluded.icon, sort_order=excluded.sort_order;

create table if not exists user_badges (
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_slug text not null references badges(slug) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_slug)
);
grant all on table user_badges to anon, authenticated, service_role;
alter table user_badges enable row level security;
create policy "user_badges read" on user_badges for select to authenticated using (true);
-- No insert/update policy: badges are granted only via SECURITY DEFINER functions
-- below, so members can't self-award.

create or replace function grant_badge(uid uuid, b text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into user_badges(user_id, badge_slug) values (uid, b) on conflict do nothing;
end; $$;

create or replace function check_badges(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_posts int; v_likes int; v_followers int; v_lessons int; v_courses int; v_streak int; v_refs int;
begin
  perform grant_badge(uid, 'welcome');

  select count(*) into v_posts from posts where author_id = uid;
  if v_posts >= 1 then perform grant_badge(uid, 'first-post'); end if;
  if v_posts >= 10 then perform grant_badge(uid, 'conversationalist'); end if;

  select count(*) into v_likes from likes l
    left join posts p on p.id = l.post_id
    left join comments c on c.id = l.comment_id
    where coalesce(p.author_id, c.author_id) = uid and l.user_id <> uid;
  if v_likes >= 25 then perform grant_badge(uid, 'well-liked'); end if;

  select count(*) into v_followers from follows where following_id = uid;
  if v_followers >= 10 then perform grant_badge(uid, 'connector'); end if;

  select count(*) into v_lessons from lesson_progress where user_id = uid;
  if v_lessons >= 1 then perform grant_badge(uid, 'first-lesson'); end if;

  select count(*) into v_courses from points_log where user_id = uid and reason like 'course completed:%';
  if v_courses >= 1 then perform grant_badge(uid, 'course-complete'); end if;
  if v_courses >= 3 then perform grant_badge(uid, 'scholar'); end if;
  if v_courses >= 12 then perform grant_badge(uid, 'graduate'); end if;

  select coalesce(streak_days, 0) into v_streak from profiles where id = uid;
  if v_streak >= 7 then perform grant_badge(uid, 'on-fire'); end if;
  if v_streak >= 30 then perform grant_badge(uid, 'unstoppable'); end if;

  select count(*) into v_refs from points_log where user_id = uid and reason = 'referral joined';
  if v_refs >= 1 then perform grant_badge(uid, 'recruiter'); end if;

  if exists (select 1 from points_log where user_id = uid and reason = 'profile completed') then
    perform grant_badge(uid, 'all-set');
  end if;
end; $$;

-- Hook badge checks into every XP event (badges grant no XP → no recursion).
create or replace function award_points(uid uuid, pts integer, why text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into points_log(user_id, amount, reason) values (uid, pts, why);
  update profiles set points = greatest(points + pts, 0) where id = uid;
  update profiles set level = level_for_xp(points) where id = uid;
  perform check_badges(uid);
end; $$;

-- Grant "welcome" on signup too.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url');
  insert into public.memberships (user_id) values (new.id);
  perform check_badges(new.id);
  return new;
end; $$;

-- Retroactively grant badges to existing members.
do $$ declare r record; begin
  for r in select id from profiles loop perform check_badges(r.id); end loop;
end $$;
