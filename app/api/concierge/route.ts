import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

// Lesson content is stored as HTML — flatten it to plain text for the prompt.
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PLATFORM_OVERVIEW = `BES (The Black Entrepreneurship Society) is a private membership community for Black entrepreneurs and business owners. The platform has these areas:
- Community: an industry-threaded discussion feed where members post, comment, and like.
- Classroom: courses broken into lessons, each with downloadable templates and member-shared tips.
- Events: live calls and workshops members RSVP to.
- Members: a leaderboard ranking members by XP.
- Messages: direct messages between members.
Members earn XP ("Founder Ascension") for activity — posting, completing lessons, daily streaks, referrals — and climb levels from Newcomer to Legacy. You are the member's built-in AI built into this platform.`;

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("The AI concierge isn't configured yet.", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in.", { status: 401 });

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request.", { status: 400 });
  }

  const history = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12);
  if (history.length === 0) return new Response("No message.", { status: 400 });

  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content || "";

  // ── Retrieve context in parallel ──────────────────────────────────────────
  const [profileRes, lessonsRes, rosterRes, coursesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, headline, industry, bio, location, points, level")
      .eq("id", user.id)
      .single(),
    supabase.rpc("search_lessons", { q: lastUser, lim: 6 }),
    supabase.rpc("concierge_member_roster", { lim: 120 }),
    supabase
      .from("courses")
      .select("title, subtitle")
      .eq("is_published", true)
      .order("sort_order"),
  ]);

  const me = profileRes.data;
  const lessons = (lessonsRes.data as
    | { lesson_title: string; course_title: string; course_slug: string; lesson_slug: string; content: string }[]
    | null) || [];
  const roster = (rosterRes.data as
    | { full_name: string | null; username: string | null; industry: string | null; headline: string | null; bio: string | null }[]
    | null) || [];
  const courses = (coursesRes.data as { title: string; subtitle: string | null }[] | null) || [];

  const courseCatalog = courses.length
    ? courses.map((c) => `- ${c.title}${c.subtitle ? ` — ${c.subtitle}` : ""}`).join("\n")
    : "(course list unavailable)";

  const lessonContext = lessons.length
    ? lessons
        .map(
          (l) =>
            `### ${l.lesson_title} (course: ${l.course_title}, link: /classroom/${l.course_slug}/${l.lesson_slug})\n${stripHtml(
              l.content,
            ).slice(0, 1800)}`,
        )
        .join("\n\n")
    : "(no classroom lessons matched this question — answer from general knowledge and the platform overview)";

  const rosterContext = roster.length
    ? roster
        .filter((m) => m.full_name)
        .map((m) => {
          const tag = [m.industry, m.headline].filter(Boolean).join(" · ");
          const bioBit = m.bio ? ` — ${m.bio.slice(0, 140)}` : "";
          const handle = m.username ? ` (@${m.username})` : "";
          return `- ${m.full_name}${handle}${tag ? `: ${tag}` : ""}${bioBit}`;
        })
        .join("\n")
    : "(member directory unavailable)";

  const meContext = me
    ? `Name: ${me.full_name || "—"}\nIndustry: ${me.industry || "not set"}\nHeadline: ${
        me.headline || "not set"
      }\nLocation: ${me.location || "not set"}\nBio: ${me.bio || "not set"}\nXP: ${me.points} (level ${me.level})`
    : "(profile unavailable)";

  const system = `You are the BES AI — the built-in concierge and business coach for every member of The Black Entrepreneurship Society. You are knowledgeable, direct, encouraging, and practical. You speak peer-to-peer with serious entrepreneurs.

Your three jobs:
1. Answer questions using the BES classroom material below, applying it to THIS member's specific business and situation.
2. Answer questions about how the platform itself works.
3. When useful, identify other BES members this person should connect with for partnership, collaboration, referrals, or complementary skills — and explain WHY each match makes sense and how to reach out.

Rules:
- Ground answers in the classroom excerpts and platform facts provided. When you draw on a lesson, mention it by name and you may link it (e.g. "see /classroom/...").
- Tailor everything to the member's industry and stage. Be specific and actionable, not generic.
- For partnership suggestions, only name members who actually appear in the directory below. Never invent members. If no one fits, say so honestly.
- If something isn't covered by the material and you're unsure, say so rather than guessing.
- Keep replies focused and skimmable. Lead with the answer.

=== PLATFORM OVERVIEW ===
${PLATFORM_OVERVIEW}

=== COURSE CATALOG ===
${courseCatalog}

=== THIS MEMBER ===
${meContext}

=== RELEVANT CLASSROOM MATERIAL (retrieved for this question) ===
${lessonContext}

=== MEMBER DIRECTORY (for collaboration matchmaking) ===
${rosterContext}`;

  const anthropic = new Anthropic({ apiKey });

  const stream = anthropic.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    system,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode("\n\n[The AI ran into an error. Please try again.]"),
        );
        console.error("concierge stream error:", err);
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
