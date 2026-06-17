# Supabase setup — BES Platform

One-time setup to bring the backend online.

## 1. Create the project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name it `bes-platform`, pick a region close to Milwaukee (e.g. `us-east-1`), set a strong DB password.
3. Wait for it to provision (~2 min).

## 2. Run the schema
In the Supabase dashboard → **SQL Editor**, run these in order:
1. [`migrations/0001_init.sql`](migrations/0001_init.sql) — tables + RLS
2. [`migrations/0002_open_access.sql`](migrations/0002_open_access.sql) — no-paywall + points triggers
3. [`migrations/0003_storage.sql`](migrations/0003_storage.sql) — storage buckets (avatars, media) + policies
4. [`seed.sql`](seed.sql) — feed categories + 12 courses

(Or, with the Supabase CLI: `supabase db push` then `supabase db execute -f supabase/seed.sql`.)

## 3. Grab the keys → `.env.local`
Dashboard → **Project Settings → API**:
- `Project URL`            → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key        → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` secret    → `SUPABASE_SERVICE_ROLE_KEY`  *(server-only, never ship to browser)*

## 4. Auth providers
Dashboard → **Authentication → Providers**:
- **Email**: enabled by default. (For magic-link or password — we use password + Google.)
- **Google**: add OAuth client id/secret (optional for v1, recommended).
- **URL Configuration**: set Site URL to your Vercel domain and add `http://localhost:3000` to redirect allow-list.

## 5. Make yourself admin
After you sign up once, in SQL Editor:
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'reginald@mindfulstaff.com');
```

## 6. Storage buckets
Already created by `0003_storage.sql` (avatars, post-media, course-media) with the right policies — nothing to do here unless you skipped step 2.

---
The `service_role` key is also what the **skool-engine** will use to write through `/api/engine/*` — the channel that finally kills the Chrome-only bottleneck.
