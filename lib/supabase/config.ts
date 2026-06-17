/**
 * True only when Supabase env vars are present. Lets the app deploy to
 * production and keep the public site up *before* the backend is wired —
 * auth/member features show a "connecting soon" state instead of crashing.
 * NOTE: NEXT_PUBLIC_* vars are inlined at build time, so after adding them
 * in Vercel you must redeploy for this to flip to true.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
