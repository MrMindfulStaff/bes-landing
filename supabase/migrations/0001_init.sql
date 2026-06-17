-- ============================================================================
-- BES Platform — initial schema
-- Replaces Skool for The Black Entrepreneurship Society.
-- Run in Supabase SQL editor (or `supabase db push`).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
create type user_role          as enum ('member', 'admin');
create type membership_status  as enum ('inactive', 'trialing', 'active', 'past_due', 'canceled');
create type enrollment_source  as enum ('membership', 'purchase', 'granted');
create type rsvp_status        as enum ('going', 'maybe', 'declined');
create type notification_type  as enum ('reply','like','mention','dm','event','challenge','system','welcome');
create type lead_status        as enum ('new','nurturing','invited','joined','lost');

-- ── Helper: updated_at trigger ──────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ============================================================================
-- PROFILES  (1:1 with auth.users)
-- ============================================================================
create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text unique,
  full_name            text,
  avatar_url           text,
  bio                  text,
  industry             text,                       -- drives cohort matching
  role                 user_role not null default 'member',
  points               integer   not null default 0,
  level                integer   not null default 1,
  referral_code        text unique not null default encode(gen_random_bytes(6), 'hex'),
  referred_by          uuid references profiles(id) on delete set null,
  onboarding_completed boolean   not null default false,
  activated_at         timestamptz,                -- first-48h activation rule
  last_active_at       timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on profiles (referred_by);
create index on profiles (industry);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ── Membership (Stripe) ─────────────────────────────────────────────────────
create table memberships (
  user_id                uuid primary key references profiles(id) on delete cascade,
  status                 membership_status not null default 'inactive',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create trigger memberships_updated before update on memberships
  for each row execute function set_updated_at();

-- ── Auth helper functions (security definer to read profiles under RLS) ──────
create or replace function is_admin(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = uid and role = 'admin');
$$;

create or replace function is_active_member(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships
    where user_id = uid and status in ('trialing','active')
  ) or is_admin(uid);
$$;

-- ============================================================================
-- COMMUNITY FEED
-- ============================================================================
create table categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  color       text default '#c9a84c',
  icon        text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references profiles(id) on delete cascade,
  category_id   uuid references categories(id) on delete set null,
  title         text,
  body          text not null,
  media         jsonb not null default '[]',       -- content-engine assets [{type,url}]
  is_pinned     boolean not null default false,
  like_count    integer not null default 0,
  comment_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on posts (category_id, created_at desc);
create index on posts (author_id);
create trigger posts_updated before update on posts
  for each row execute function set_updated_at();

create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  parent_id  uuid references comments(id) on delete cascade,   -- threading
  body       text not null,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on comments (post_id, created_at);
create trigger comments_updated before update on comments
  for each row execute function set_updated_at();

create table likes (
  user_id    uuid not null references profiles(id) on delete cascade,
  post_id    uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- exactly one target
  constraint like_one_target check (num_nonnulls(post_id, comment_id) = 1)
);
create unique index likes_post_uniq    on likes (user_id, post_id)    where post_id is not null;
create unique index likes_comment_uniq on likes (user_id, comment_id) where comment_id is not null;

-- Keep counters in sync
create or replace function bump_counts()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'comments' then
    if tg_op = 'INSERT' then update posts set comment_count = comment_count + 1 where id = new.post_id;
    elsif tg_op = 'DELETE' then update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id; end if;
  elsif tg_table_name = 'likes' then
    if tg_op = 'INSERT' then
      if new.post_id    is not null then update posts    set like_count = like_count + 1 where id = new.post_id; end if;
      if new.comment_id is not null then update comments set like_count = like_count + 1 where id = new.comment_id; end if;
    elsif tg_op = 'DELETE' then
      if old.post_id    is not null then update posts    set like_count = greatest(like_count - 1,0) where id = old.post_id; end if;
      if old.comment_id is not null then update comments set like_count = greatest(like_count - 1,0) where id = old.comment_id; end if;
    end if;
  end if;
  return null;
end; $$;
create trigger comments_count after insert or delete on comments for each row execute function bump_counts();
create trigger likes_count    after insert or delete on likes    for each row execute function bump_counts();

-- ============================================================================
-- CLASSROOM  (courses → modules → lessons → progress)
-- ============================================================================
create table courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text unique not null,
  subtitle       text,
  description    text,
  cover_url      text,
  is_paid        boolean not null default false,
  price_cents    integer,                          -- one-time purchase price
  stripe_price_id text,
  industry       text,                             -- paid industry classrooms
  min_cohort     integer default 0,                -- census gate (>=5 to launch)
  is_published   boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger courses_updated before update on courses
  for each row execute function set_updated_at();

create table modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  title      text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index on modules (course_id, sort_order);

create table lessons (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references modules(id) on delete cascade,
  title        text not null,
  slug         text not null,
  content      text,                               -- rich text / markdown
  video_url    text,
  attachments  jsonb not null default '[]',
  drip_days    integer not null default 0,         -- days after enrollment to unlock
  is_published boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on lessons (module_id, sort_order);
create trigger lessons_updated before update on lessons
  for each row execute function set_updated_at();

create table enrollments (
  user_id     uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  source      enrollment_source not null default 'membership',
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table lesson_progress (
  user_id      uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ============================================================================
-- EVENTS / CALENDAR
-- ============================================================================
create table events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  cover_url   text,
  location    text,                                -- url or physical
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index on events (starts_at);

create table event_rsvps (
  event_id uuid not null references events(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  status   rsvp_status not null default 'going',
  primary key (event_id, user_id)
);

-- ============================================================================
-- CHALLENGES  (monthly arcs — e.g. "One Constraint July")
-- ============================================================================
create table challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text unique not null,
  theme       text,
  description text,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
create table challenge_participants (
  challenge_id uuid not null references challenges(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  progress     jsonb not null default '{}',
  joined_at    timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

-- ============================================================================
-- DIRECT MESSAGES
-- ============================================================================
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  is_group   boolean not null default false,
  title      text,                                 -- for cohort/group chats
  created_at timestamptz not null default now()
);
create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index on messages (conversation_id, created_at desc);

create or replace function is_conversation_member(conv uuid, uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv and user_id = uid
  );
$$;

-- ============================================================================
-- GAMIFICATION  (points audit → drives level + leaderboard)
-- ============================================================================
create table points_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  amount     integer not null,
  reason     text not null,
  created_at timestamptz not null default now()
);
create index on points_log (user_id, created_at desc);

create or replace function award_points(uid uuid, pts integer, why text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into points_log(user_id, amount, reason) values (uid, pts, why);
  update profiles
     set points = points + pts,
         level  = greatest(1, floor(sqrt((points + pts) / 10.0))::int + 1)
   where id = uid;
end; $$;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        notification_type not null,
  actor_id    uuid references profiles(id) on delete set null,
  target_type text,
  target_id   uuid,
  data        jsonb not null default '{}',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

-- ============================================================================
-- ACQUISITION FUNNEL  (public lead capture → invite → join)
-- ============================================================================
create table leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text,
  source      text,                                -- utm / referral / lead magnet
  lead_magnet text,
  referral_code text,                              -- which member referred
  status      lead_status not null default 'new',
  metadata    jsonb not null default '{}',
  user_id     uuid references profiles(id) on delete set null,  -- once they join
  created_at  timestamptz not null default now()
);
create index on leads (email);
create index on leads (status);

create table referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references profiles(id) on delete cascade,
  referred_email  text,
  referred_user_id uuid references profiles(id) on delete set null,
  status          lead_status not null default 'new',
  reward_cents    integer not null default 0,
  created_at      timestamptz not null default now()
);
create index on referrals (referrer_id);

-- ============================================================================
-- AUTOMATION LOG  (audit trail for the engine's API writes)
-- ============================================================================
create table automation_log (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  actor      text not null default 'skool-engine',
  payload    jsonb not null default '{}',
  result     jsonb,
  created_at timestamptz not null default now()
);
create index on automation_log (created_at desc);

-- ============================================================================
-- New-user trigger: auto-create profile + inactive membership row
-- ============================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          new.raw_user_meta_data->>'avatar_url');
  insert into public.memberships (user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Service-role (engine) bypasses all of this. anon/auth users are governed here.
-- ============================================================================
alter table profiles                 enable row level security;
alter table memberships              enable row level security;
alter table categories               enable row level security;
alter table posts                    enable row level security;
alter table comments                 enable row level security;
alter table likes                    enable row level security;
alter table courses                  enable row level security;
alter table modules                  enable row level security;
alter table lessons                  enable row level security;
alter table enrollments              enable row level security;
alter table lesson_progress          enable row level security;
alter table events                   enable row level security;
alter table event_rsvps              enable row level security;
alter table challenges               enable row level security;
alter table challenge_participants   enable row level security;
alter table conversations            enable row level security;
alter table conversation_participants enable row level security;
alter table messages                 enable row level security;
alter table points_log               enable row level security;
alter table notifications            enable row level security;
alter table leads                    enable row level security;
alter table referrals                enable row level security;
alter table automation_log           enable row level security;

-- Profiles: any authed user can read; you edit your own; admins edit all.
create policy "profiles read"        on profiles for select to authenticated using (true);
create policy "profiles update self" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin all"   on profiles for all    to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Memberships: read your own; admins all. (Writes happen via service role / Stripe webhook.)
create policy "membership read self" on memberships for select to authenticated using (user_id = auth.uid() or is_admin(auth.uid()));

-- Categories: members read; admins manage.
create policy "categories read"  on categories for select to authenticated using (is_active_member(auth.uid()));
create policy "categories admin" on categories for all    to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Posts: active members read; author writes own; admins moderate.
create policy "posts read"        on posts for select to authenticated using (is_active_member(auth.uid()));
create policy "posts insert own"  on posts for insert to authenticated with check (author_id = auth.uid() and is_active_member(auth.uid()));
create policy "posts update own"  on posts for update to authenticated using (author_id = auth.uid() or is_admin(auth.uid())) with check (author_id = auth.uid() or is_admin(auth.uid()));
create policy "posts delete own"  on posts for delete to authenticated using (author_id = auth.uid() or is_admin(auth.uid()));

-- Comments: same shape.
create policy "comments read"       on comments for select to authenticated using (is_active_member(auth.uid()));
create policy "comments insert own" on comments for insert to authenticated with check (author_id = auth.uid() and is_active_member(auth.uid()));
create policy "comments update own" on comments for update to authenticated using (author_id = auth.uid() or is_admin(auth.uid())) with check (author_id = auth.uid() or is_admin(auth.uid()));
create policy "comments delete own" on comments for delete to authenticated using (author_id = auth.uid() or is_admin(auth.uid()));

-- Likes: read if member; manage your own.
create policy "likes read"   on likes for select to authenticated using (is_active_member(auth.uid()));
create policy "likes insert" on likes for insert to authenticated with check (user_id = auth.uid() and is_active_member(auth.uid()));
create policy "likes delete" on likes for delete to authenticated using (user_id = auth.uid());

-- Classroom: published content readable by members; paid courses require enrollment.
create policy "courses read" on courses for select to authenticated
  using (is_admin(auth.uid()) or (is_published and (not is_paid or exists (
    select 1 from enrollments e where e.course_id = courses.id and e.user_id = auth.uid()
  ))));
create policy "courses admin" on courses for all to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "modules read" on modules for select to authenticated
  using (exists (select 1 from courses c where c.id = modules.course_id));  -- gated by course policy
create policy "modules admin" on modules for all to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "lessons read" on lessons for select to authenticated
  using (is_published and exists (select 1 from modules m where m.id = lessons.module_id));
create policy "lessons admin" on lessons for all to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create policy "enrollments self"  on enrollments     for select to authenticated using (user_id = auth.uid() or is_admin(auth.uid()));
create policy "progress self"     on lesson_progress for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Events: members read; admins manage; everyone RSVPs for self.
create policy "events read"  on events for select to authenticated using (is_active_member(auth.uid()));
create policy "events admin" on events for all    to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "rsvp self"    on event_rsvps for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Challenges.
create policy "challenges read"  on challenges for select to authenticated using (is_active_member(auth.uid()));
create policy "challenges admin" on challenges for all    to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "challenge join"   on challenge_participants for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Direct messages: only participants.
create policy "conversations read" on conversations for select to authenticated using (is_conversation_member(id, auth.uid()));
create policy "participants read"  on conversation_participants for select to authenticated using (user_id = auth.uid() or is_conversation_member(conversation_id, auth.uid()));
create policy "participants self"  on conversation_participants for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "messages read"      on messages for select to authenticated using (is_conversation_member(conversation_id, auth.uid()));
create policy "messages send"      on messages for insert to authenticated with check (sender_id = auth.uid() and is_conversation_member(conversation_id, auth.uid()));

-- Points log: read your own + leaderboard reads profiles directly.
create policy "points read self" on points_log for select to authenticated using (user_id = auth.uid() or is_admin(auth.uid()));

-- Notifications: yours only.
create policy "notifications self" on notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Referrals: yours only.
create policy "referrals self" on referrals for select to authenticated using (referrer_id = auth.uid() or is_admin(auth.uid()));

-- Leads + automation_log: admin-only via UI (engine uses service role).
create policy "leads admin"      on leads          for all to authenticated using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "automation admin" on automation_log for select to authenticated using (is_admin(auth.uid()));

-- Public funnel can insert a lead (anon) — captured before signup.
create policy "leads public insert" on leads for insert to anon with check (true);

-- ============================================================================
-- Realtime: feed, DMs, notifications
-- ============================================================================
alter publication supabase_realtime add table posts, comments, likes, messages, notifications;
