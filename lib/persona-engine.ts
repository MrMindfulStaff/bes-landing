import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/engine";
import { PERSONAS, personaSystem, type Persona } from "@/lib/personas";

// Moderate cadence: each persona posts roughly every ~2.5 days; a handful of
// reactive comments per run.
const POST_INTERVAL_MS = 2.5 * 24 * 3600_000;
const MAX_POSTS_PER_RUN = 1; // spread posts across runs
const MAX_COMMENTS_PER_RUN = 3;
const LOOKBACK_MS = 2 * 24 * 3600_000;

const LANE_KEYWORDS: Record<string, string[]> = {
  "marcus-whitfield": ["fund", "loan", "capital", "grant", "credit", "sba", "investor", "money", "cash flow", "financ", "bank", "revenue", "profit"],
  "imani-carter": ["market", "brand", "content", "social", "instagram", "tiktok", "customer", "audience", " ad", "promo", "logo", "website", "launch", "followers", "sales funnel"],
  "darius-hale": ["sales", "sell", "close", "client", "system", "process", "operation", "scale", "hire", "team", "pipeline", "follow up", "follow-up", "crm", "delegat"],
};
const PREFERRED_CATEGORY: Record<string, string> = {
  "marcus-whitfield": "support",
  "imani-carter": "marketing-growth",
  "darius-hale": "lets-talk",
};

type Admin = ReturnType<typeof createAdminClient>;

function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

async function genText(system: string, user: string, maxTokens = 400): Promise<string> {
  const r = await anthropic().messages.create({
    model: "claude-opus-4-8",
    max_tokens: maxTokens,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: user }],
  });
  return r.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export async function runPersonaCycle() {
  if (!process.env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY not set" };
  const admin: Admin = createAdminClient();

  // Resolve persona profile ids (match by name) + thread categories.
  const { data: profs } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("is_persona", true);
  const { data: cats } = await admin.from("categories").select("id, slug");
  const catBySlug = new Map((cats || []).map((c: any) => [c.slug, c.id]));
  const defaultCat = (cats || [])[0]?.id ?? null;

  const roster = PERSONAS.map((p) => ({
    p,
    id: (profs || []).find((pr: any) => pr.full_name === p.name)?.id as string | undefined,
  })).filter((x) => x.id) as { p: Persona; id: string }[];

  const actions: string[] = [];

  // 1) Scheduled posts (cadence-gated, capped per run).
  let posted = 0;
  for (const { p, id } of roster) {
    if (posted >= MAX_POSTS_PER_RUN) break;
    const { data: last } = await admin
      .from("posts")
      .select("created_at, body")
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(5);
    const lastAt = last?.[0]?.created_at ? new Date(last[0].created_at).getTime() : 0;
    if (Date.now() - lastAt < POST_INTERVAL_MS) continue;

    const avoid = (last || []).map((r: any) => "- " + (r.body || "").slice(0, 90)).join("\n");
    const body = await genText(
      personaSystem(p),
      `Write ONE short, valuable post for the BES community feed, in your lane (${p.lane}). 2–5 sentences, conversational, and end with a question that invites members to reply. Don't repeat these recent posts of yours:\n${avoid || "(none yet)"}\nOutput only the post text — no preamble, no quotes.`,
    );
    if (!body) continue;
    const category_id = catBySlug.get(PREFERRED_CATEGORY[p.slug]) ?? defaultCat;
    const { data: np } = await admin
      .from("posts")
      .insert({ author_id: id, body, category_id })
      .select("id")
      .single();
    await logAction(admin, "persona_post", { persona: p.slug }, { post_id: np?.id });
    actions.push(`${p.name} posted`);
    posted++;
  }

  // 2) Reactive: comment + like on recent member posts that match a lane.
  const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
  const { data: recent } = await admin
    .from("posts")
    .select("id, title, body, author_id, author:profiles!posts_author_id_fkey(is_persona)")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(40);

  let commented = 0;
  for (const post of recent || []) {
    if (commented >= MAX_COMMENTS_PER_RUN) break;
    const author = Array.isArray((post as any).author) ? (post as any).author[0] : (post as any).author;
    if (author?.is_persona) continue; // don't engage with persona posts

    const text = `${(post as any).title || ""} ${(post as any).body || ""}`.toLowerCase();
    const match = roster.find(({ p }) => LANE_KEYWORDS[p.slug].some((k) => text.includes(k)));
    if (!match) continue;

    const { data: already } = await admin
      .from("comments")
      .select("id")
      .eq("post_id", (post as any).id)
      .eq("author_id", match.id)
      .limit(1);
    if (already && already.length) continue;

    const comment = await genText(
      personaSystem(match.p),
      `A member posted this in the BES community:\n"""${((post as any).title ? (post as any).title + "\n" : "") + (post as any).body}"""\nReply with ONE genuinely helpful, encouraging comment in your lane — 1–3 sentences, specific and useful. Output only the comment.`,
      300,
    );
    if (!comment) continue;

    await admin.from("comments").insert({ post_id: (post as any).id, author_id: match.id, body: comment });
    // like it too (ignore duplicate-like errors)
    await admin.from("likes").insert({ user_id: match.id, post_id: (post as any).id });
    await logAction(admin, "persona_comment", { persona: match.p.slug, post: (post as any).id }, {});
    actions.push(`${match.p.name} commented`);
    commented++;
  }

  return { ok: true, posted, commented, actions };
}
