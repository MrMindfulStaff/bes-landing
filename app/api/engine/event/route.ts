import { createAdminClient } from "@/lib/supabase/admin";
import {
  authorizeEngine,
  unauthorized,
  notConfigured,
  logAction,
  resolveAuthorId,
} from "@/lib/engine";

export const runtime = "nodejs";

// Create an event.
// Body: { title, starts_at(ISO), description?, location?, ends_at?(ISO), cover_url?, created_by? }
export async function POST(req: Request) {
  if (!process.env.ENGINE_API_KEY) return notConfigured();
  if (!authorizeEngine(req)) return unauthorized();

  let payload: {
    title?: string;
    starts_at?: string;
    description?: string;
    location?: string;
    ends_at?: string;
    cover_url?: string;
    created_by?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = String(payload.title || "").trim();
  const startsAt = String(payload.starts_at || "");
  if (!title || !startsAt) {
    return Response.json({ error: "title and starts_at are required." }, { status: 400 });
  }
  const start = new Date(startsAt);
  if (isNaN(start.getTime())) {
    return Response.json({ error: "starts_at must be a valid date." }, { status: 400 });
  }

  const admin = createAdminClient();
  const createdBy = await resolveAuthorId(admin, payload.created_by);

  const { data, error } = await admin
    .from("events")
    .insert({
      title,
      description: payload.description?.trim() || null,
      location: payload.location?.trim() || null,
      cover_url: payload.cover_url?.trim() || null,
      starts_at: start.toISOString(),
      ends_at: payload.ends_at ? new Date(payload.ends_at).toISOString() : null,
      created_by: createdBy,
    })
    .select("id")
    .single();

  await logAction(admin, "create_event", payload, error ? { error: error.message } : data);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
