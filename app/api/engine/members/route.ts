import { createAdminClient } from "@/lib/supabase/admin";
import { authorizeEngine, unauthorized, notConfigured } from "@/lib/engine";

export const runtime = "nodejs";

// Read the member roster + lightweight stats (for the growth engine to target).
// Query: ?limit=200
export async function GET(req: Request) {
  if (!process.env.ENGINE_API_KEY) return notConfigured();
  if (!authorizeEngine(req)) return unauthorized();

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 200, 1), 1000);

  const admin = createAdminClient();
  const [{ data: members, error }, { count }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, username, industry, headline, points, level, last_active_at, created_at")
      .order("last_active_at", { ascending: false, nullsFirst: false })
      .limit(limit),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, total: count ?? members?.length ?? 0, members: members ?? [] });
}
