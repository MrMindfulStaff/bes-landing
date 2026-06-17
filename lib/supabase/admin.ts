import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES RLS — server-only.
 * This is the engine's write channel: the skool-engine (and other trusted
 * automations) hit /api/engine/* which use this client to post, DM, publish
 * classroom modules, etc. — the thing Skool's Chrome-only constraint blocked.
 *
 * NEVER import this into a Client Component or expose the key to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
