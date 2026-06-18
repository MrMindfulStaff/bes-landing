import { createAdminClient } from "@/lib/supabase/admin";
import {
  authorizeEngine,
  unauthorized,
  notConfigured,
  logAction,
  resolveAuthorId,
  resolveCategoryId,
} from "@/lib/engine";

export const runtime = "nodejs";

// Create a community post.
// Body: { body, title?, category?(slug|uuid), author_id?, media?:[{type,url}] }
export async function POST(req: Request) {
  if (!process.env.ENGINE_API_KEY) return notConfigured();
  if (!authorizeEngine(req)) return unauthorized();

  let payload: {
    body?: string;
    title?: string;
    category?: string;
    author_id?: string;
    media?: { type: string; url: string }[];
  };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const body = String(payload.body || "").trim();
  if (!body) return Response.json({ error: "body is required." }, { status: 400 });

  const admin = createAdminClient();
  const authorId = await resolveAuthorId(admin, payload.author_id);
  if (!authorId) {
    return Response.json({ error: "No author available (no admin profile)." }, { status: 422 });
  }
  const categoryId = await resolveCategoryId(admin, payload.category);

  const { data, error } = await admin
    .from("posts")
    .insert({
      author_id: authorId,
      body,
      title: payload.title?.trim() || null,
      category_id: categoryId,
      media: Array.isArray(payload.media) ? payload.media : [],
    })
    .select("id")
    .single();

  await logAction(admin, "create_post", payload, error ? { error: error.message } : data);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id });
}
