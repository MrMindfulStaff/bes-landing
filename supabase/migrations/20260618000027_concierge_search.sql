-- ============================================================================
-- 0027 — AI Concierge retrieval
-- Full-text search over published lesson content + a member roster view the
-- Claude-based concierge uses for partnership/collaboration matchmaking.
-- ============================================================================

-- GIN index backing the lesson search (title + content, English stemming).
create index if not exists lessons_fts_idx on lessons
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Retrieve the most relevant published lessons for a natural-language query.
-- SECURITY DEFINER so the concierge can read across all published courses
-- regardless of the caller's per-course enrollment (classroom material is the
-- shared knowledge base every member's AI gets to draw on).
create or replace function search_lessons(q text, lim int default 6)
returns table (
  lesson_id    uuid,
  lesson_title text,
  lesson_slug  text,
  course_title text,
  course_slug  text,
  content      text,
  rank         real
) language sql security definer stable set search_path = public as $$
  select l.id,
         l.title,
         l.slug,
         c.title,
         c.slug,
         left(l.content, 4000),
         ts_rank(
           to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.content, '')),
           websearch_to_tsquery('english', q)
         ) as rank
  from lessons l
  join modules m on m.id = l.module_id
  join courses c on c.id = m.course_id
  where l.is_published
    and q is not null and length(btrim(q)) > 0
    and to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.content, ''))
        @@ websearch_to_tsquery('english', q)
  order by rank desc
  limit greatest(1, least(coalesce(lim, 6), 12));
$$;
grant execute on function search_lessons(text, int) to authenticated;

-- Member roster for collaboration matchmaking. Profiles are already readable by
-- any authenticated user (RLS "profiles read" = true); this just shapes the
-- columns the concierge needs and keeps the payload bounded.
create or replace function concierge_member_roster(lim int default 200)
returns table (
  id        uuid,
  full_name text,
  username  text,
  industry  text,
  headline  text,
  bio       text,
  location  text
) language sql security definer stable set search_path = public as $$
  select p.id, p.full_name, p.username, p.industry, p.headline, p.bio, p.location
  from profiles p
  where coalesce(p.industry, p.headline, p.bio) is not null
  order by p.last_active_at desc nulls last
  limit greatest(1, least(coalesce(lim, 200), 500));
$$;
grant execute on function concierge_member_roster(int) to authenticated;
