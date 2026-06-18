-- ============================================================================
-- 0025 — Notifications: generate on comment / like / follow / badge events.
-- ============================================================================

-- Free up the type column (was an enum) so we can use any type string.
alter table notifications alter column type set data type text using type::text;

-- Resolve the in-app link for a post (its thread, or its course tips tab).
create or replace function post_href(p_post uuid)
returns text language sql stable set search_path = public as $$
  select case
    when p.course_id   is not null then '/classroom/' || c.slug || '?tab=tips'
    when p.category_id is not null then '/community/' || cat.slug
    else '/community' end
  from posts p
  left join categories cat on cat.id = p.category_id
  left join courses c on c.id = p.course_id
  where p.id = p_post;
$$;

-- Create a notification (snapshots actor name/avatar; skips self-notifications).
create or replace function notify(p_user uuid, p_type text, p_actor uuid, p_message text, p_href text)
returns void language plpgsql security definer set search_path = public as $$
declare an text; aa text;
begin
  if p_user is null or p_user = p_actor then return; end if;
  select full_name, avatar_url into an, aa from profiles where id = p_actor;
  insert into notifications (user_id, type, actor_id, data)
  values (p_user, p_type, p_actor,
          jsonb_build_object('message', p_message, 'href', p_href, 'actor_name', an, 'actor_avatar', aa));
end; $$;

-- Comment on your post → "reply"
create or replace function notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid;
begin
  select author_id into author from posts where id = new.post_id;
  if author is not null then perform notify(author, 'reply', new.author_id, 'commented on your post', post_href(new.post_id)); end if;
  return null;
end; $$;
drop trigger if exists comments_notify on comments;
create trigger comments_notify after insert on comments for each row execute function notify_on_comment();

-- Like on your post/comment → "like"
create or replace function notify_on_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare author uuid; msg text; href text;
begin
  if new.post_id is not null then
    select author_id, post_href(new.post_id) into author, href from posts where id = new.post_id;
    msg := 'liked your post';
  else
    select c.author_id, post_href(c.post_id) into author, href from comments c where c.id = new.comment_id;
    msg := 'liked your comment';
  end if;
  if author is not null then perform notify(author, 'like', new.user_id, msg, coalesce(href, '/community')); end if;
  return null;
end; $$;
drop trigger if exists likes_notify on likes;
create trigger likes_notify after insert on likes for each row execute function notify_on_like();

-- New follower → "follow"
create or replace function notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform notify(new.following_id, 'follow', new.follower_id, 'started following you', '/members/' || new.follower_id);
  return null;
end; $$;
drop trigger if exists follows_notify on follows;
create trigger follows_notify after insert on follows for each row execute function notify_on_follow();

-- Earned a badge → "badge" (no actor)
create or replace function notify_on_badge()
returns trigger language plpgsql security definer set search_path = public as $$
declare bname text; bicon text;
begin
  select name, icon into bname, bicon from badges where slug = new.badge_slug;
  insert into notifications (user_id, type, data)
  values (new.user_id, 'badge', jsonb_build_object('message', 'You earned the ' || bname || ' ' || bicon || ' badge', 'href', '/profile'));
  return null;
end; $$;
drop trigger if exists user_badges_notify on user_badges;
create trigger user_badges_notify after insert on user_badges for each row execute function notify_on_badge();
