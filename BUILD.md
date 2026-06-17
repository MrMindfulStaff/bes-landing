# BES Platform — Build Plan

Replacing Skool for **The Black Entrepreneurship Society** with our own platform.
Grown from the existing `bes-landing` repo so the public landing becomes the
funnel's front door and the member app lives behind it under one domain.

- **Repo:** `MrMindfulStaff/bes-landing` (branch `platform` → merge to `main` to ship)
- **Stack:** Next.js 16 (App Router) · Supabase (Postgres/Auth/Realtime/Storage) · Stripe · Vercel
- **Brand:** dark `#0d0d0d` + gold `#c9a84c`, Inter + Playfair Display
- **Decisions locked:** full feature parity + all 4 differentiators · Supabase backend · member records ported / fresh content

## Differentiators (the reason we leave Skool)
1. **Acquisition funnel** — public landing → lead magnet → join → AI first-48h activation
2. **Content-engine integration** — flyers/video/captions post natively (no Chrome staging)
3. **AI concierge** — in-community answers, onboarding, stale-thread surfacing
4. **Automation API** — `/api/engine/*` lets the skool-engine write directly via service-role key

---

## Phase status

### ✅ Phase 0 — Foundation
- [x] `platform` branch off live landing
- [x] Deps: `@supabase/supabase-js`, `@supabase/ssr`, `stripe`, `@stripe/stripe-js`, TypeScript
- [x] Next patched to 16.2.9 (middleware-bypass advisory)
- [x] Full DB schema + RLS — `supabase/migrations/0001_init.sql` (22 tables)
- [x] Seed: feed categories + 12 courses — `supabase/seed.sql`
- [x] Supabase clients: `lib/supabase/{client,server,admin,middleware}.ts`
- [x] Root `middleware.ts` (session refresh + member-area guard)
- [x] Auth helpers `lib/auth.ts`
- [x] `.env.example`, `supabase/README.md`
- [ ] **YOU:** create Supabase project, run SQL, drop keys into `.env.local` (see `supabase/README.md`)
- [ ] **YOU:** create Stripe account + $50/mo product

### ⬜ Phase 1 — Social core
- [ ] Route groups: `(marketing)` public / `(app)` authenticated
- [ ] Auth pages: `/login`, `/signup`, `/auth/callback`, password reset
- [ ] App shell: sidebar nav, header, mobile nav
- [ ] Feed: list + composer + post detail + threaded comments + likes (realtime)
- [ ] Profiles: view/edit, avatar upload
- [ ] Gamification: points on actions, level badge, leaderboard, industry cohorts
- [ ] Point landing "Join" button at `/join` instead of Skool

### ⬜ Phase 2 — Classroom
- [ ] Course list + course detail (modules/lessons)
- [ ] Lesson viewer + progress tracking + drip unlock
- [ ] Admin authoring; publish from `classroom-pipeline.json`

### ⬜ Phase 3 — Events + DMs
- [ ] Events list/detail/RSVP + calendar view
- [ ] Realtime DMs (1:1 + cohort groups) with unread badges

### ⬜ Phase 4 — Monetization
- [ ] Stripe Checkout for $50/mo membership + webhook → `memberships`
- [ ] `/join` flow; gate member area on active status
- [ ] One-time industry-classroom purchases + cohort chat provisioning
- [ ] Affiliate/referral payout tracking (40% recurring)

### ⬜ Phase 5 — The edge
- [ ] Public funnel: lead capture, lead magnet delivery, referral attribution
- [ ] AI first-48h activation sequence
- [ ] Content-engine → native post publishing
- [ ] AI concierge (RAG over community + classroom)
- [ ] `/api/engine/*` endpoints + re-point skool-engine off Chrome

---

## Conventions
- New code is **TypeScript**; the original landing stays `.js` (Next compiles both).
- Server reads via `lib/supabase/server.ts`; browser via `lib/supabase/client.ts`.
- Trusted automations only ever touch `lib/supabase/admin.ts` behind `/api/engine/*` with the `x-engine-key` header.
- Ship a phase = merge `platform` → `main`; Vercel auto-deploys. Preview deploys run on every `platform` push.
