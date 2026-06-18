import { createAdminClient } from "@/lib/supabase/admin";
import { authorizeEngine, unauthorized, notConfigured, logAction } from "@/lib/engine";

export const runtime = "nodejs";

// Capture a lead into the acquisition funnel.
// Body: { email, name?, source?, lead_magnet?, referral_code?, metadata? }
export async function POST(req: Request) {
  if (!process.env.ENGINE_API_KEY) return notConfigured();
  if (!authorizeEngine(req)) return unauthorized();

  let payload: {
    email?: string;
    name?: string;
    source?: string;
    lead_magnet?: string;
    referral_code?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = String(payload.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .insert({
      email,
      name: payload.name?.trim() || null,
      source: payload.source?.trim() || null,
      lead_magnet: payload.lead_magnet?.trim() || null,
      referral_code: payload.referral_code?.trim() || null,
      metadata: payload.metadata ?? {},
    })
    .select("id")
    .single();

  await logAction(admin, "capture_lead", { ...payload, email }, error ? { error: error.message } : data);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
