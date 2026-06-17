import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client (Client Components).
 * Safe to use the anon key here — RLS enforces access.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
