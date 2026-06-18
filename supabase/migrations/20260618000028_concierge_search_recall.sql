-- ============================================================================
-- 0028 — Concierge retrieval recall fix
-- websearch_to_tsquery AND's every term, so a verbose natural-language question
-- ("...in one short paragraph... name a lesson if one applies") matched nothing.
-- Switch to an OR-of-lexemes query: any term can match, and ts_rank still floats
-- the most relevant lesson to the top.
-- ============================================================================

create or replace function search_lessons(q text, lim int default 6)
returns table (
  lesson_id    uuid,
  lesson_title text,
  lesson_slug  text,
  course_title text,
  course_slug  text,
  content      text,
  rank         real
) language plpgsql security definer stable set search_path = public as $$
declare tsq tsquery;
begin
  -- plainto_tsquery drops stopwords and renders 'a' & 'b' & 'c'; OR the lexemes.
  tsq := nullif(replace(plainto_tsquery('english', coalesce(q, ''))::text, ' & ', ' | '), '')::tsquery;
  if tsq is null then
    return;
  end if;

  return query
    select l.id,
           l.title,
           l.slug,
           c.title,
           c.slug,
           left(l.content, 4000),
           ts_rank(
             to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.content, '')),
             tsq
           ) as rank
    from lessons l
    join modules m on m.id = l.module_id
    join courses c on c.id = m.course_id
    where l.is_published
      and to_tsvector('english', coalesce(l.title, '') || ' ' || coalesce(l.content, '')) @@ tsq
    order by rank desc
    limit greatest(1, least(coalesce(lim, 6), 12));
end; $$;
grant execute on function search_lessons(text, int) to authenticated;
