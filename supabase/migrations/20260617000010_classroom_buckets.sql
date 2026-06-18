-- ============================================================================
-- 0010 — Classroom buckets: Templates + course-scoped Tips & Tricks
-- ============================================================================

-- Tips & Tricks reuse the posts table, scoped to a course.
alter table posts add column if not exists course_id uuid references courses(id) on delete cascade;
create index if not exists posts_course_idx on posts (course_id, created_at desc);

-- Downloadable templates per course.
create table if not exists templates (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references courses(id) on delete cascade,
  title       text not null,
  description text,
  file_url    text not null,
  file_name   text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists templates_course_idx on templates (course_id);

grant all on table templates to anon, authenticated, service_role;
alter table templates enable row level security;
create policy "templates read"  on templates for select to authenticated using (is_active_member(auth.uid()));
create policy "templates admin" on templates for all    to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
