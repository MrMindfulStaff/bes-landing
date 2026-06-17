# Supabase setup — BES Platform

One-time setup to bring the backend online.

## 1. Create the project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Name it `bes-platform`, pick a region close to Milwaukee (e.g. `us-east-1`), set a strong DB password.
3. Wait for it to provision (~2 min).

## 2. Run the schema
In the Supabase dashboard → **SQL Editor**:
1. Paste the contents of [`migrations/0001_init.sql`](migrations/0001_init.sql) → **Run**.
2. Paste the contents of [`seed.sql`](seed.sql) → **Run**.

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

## 6. Storage buckets (Phase 1+)
Dashboard → **Storage** → create public buckets: `avatars`, `post-media`, `course-media`.

---
The `service_role` key is also what the **skool-engine** will use to write through `/api/engine/*` — the channel that finally kills the Chrome-only bottleneck.
