-- ============================================================================
-- 0002 — Open access (no paywall yet) + points triggers
-- ============================================================================

-- Any signed-up user counts as a member. When we add the paywall later,
-- a follow-up migration restores the membership-status check.
create or replace function is_active_member(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = uid);
$$;

-- Award points automatically server-side via triggers, so the browser can't
-- inflate scores by calling the RPC directly.
revoke execute on function award_points(uuid, integer, text) from public;

create or replace function award_post_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.author_id, 10, 'post');
  return new;
end; $$;

create or replace function award_comment_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_points(new.author_id, 5, 'comment');
  return new;
end; $$;

create trigger posts_award_points    after insert on posts    for each row execute function award_post_points();
create trigger comments_award_points after insert on comments for each row execute function award_comment_points();
