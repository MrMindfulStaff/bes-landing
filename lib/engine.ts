import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared plumbing for the /api/engine/* automation API.
 *
 * Trusted automations (skool-engine, content-engine) authenticate with a single
 * shared secret (ENGINE_API_KEY) and write through the service-role client,
 * bypassing RLS. Every action is recorded in automation_log.
 */

type Admin = ReturnType<typeof createAdminClient>;

/** True if the request carries the correct engine key. */
export function authorizeEngine(req: Request): boolean {
  const expected = process.env.ENGINE_API_KEY;
  if (!expected) return false;
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const headerKey = req.headers.get("x-engine-key") || "";
  const provided = bearer || headerKey;
  // length check first to avoid leaking via early-return timing on obvious misses
  return provided.length === expected.length && provided === expected;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function notConfigured() {
  return Response.json(
    { error: "Engine API not configured (missing ENGINE_API_KEY)." },
    { status: 503 },
  );
}

/** Record an automation action; never throws (logging must not break the call). */
export async function logAction(
  admin: Admin,
  action: string,
  payload: unknown,
  result: unknown,
) {
  try {
    await admin.from("automation_log").insert({
      action,
      actor: "engine-api",
      payload: payload ?? {},
      result: result ?? {},
    });
  } catch {
    /* swallow */
  }
}

/** Resolve the author for engine-created posts: explicit id, env default, or first admin. */
export async function resolveAuthorId(
  admin: Admin,
  explicit?: string | null,
): Promise<string | null> {
  if (explicit) return explicit;
  if (process.env.ENGINE_AUTHOR_ID) return process.env.ENGINE_AUTHOR_ID;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve a category given a uuid or a slug. Returns null if not found/blank. */
export async function resolveCategoryId(
  admin: Admin,
  category?: string | null,
): Promise<string | null> {
  if (!category) return null;
  if (UUID_RE.test(category)) return category;
  const { data } = await admin
    .from("categories")
    .select("id")
    .eq("slug", category)
    .maybeSingle();
  return data?.id ?? null;
}
