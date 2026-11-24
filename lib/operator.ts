import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The Operator (24 Nov 2026): runs BES as Reginald, on his own account.
 *
 * Everything it does is written as him, from his profile (OPERATOR_USER_ID, default his id):
 *   - welcomes:    a DM to each real new member in their first two weeks
 *   - replies:     a comment + like on new member posts, and replies to comments on his posts
 *   - nudges:      a DM to real members who have gone quiet (once a month, three times at most)
 *   - milestones:  a DM congratulating course completions and graduation
 *   - weekly:      a Monday focus post and a Friday "Flowers on Friday" post
 *
 * It never acts for spam signups (random-string names, never signed in or confirmed), the
 * BES Mentor personas, or other admins. Anything that needs his own judgment (money,
 * partnerships, complaints, personal hardship, legal, press) is not answered: it is logged as
 * needs_you and shown on /admin/operator, along with member DMs to him that are waiting.
 * Every action is logged to automation_log with actor = 'operator'.
 */

export const OPERATOR_ID = process.env.OPERATOR_USER_ID || "fd865f09-7190-42d8-89e7-8a4495197e2f";
const ACTOR = "operator";
const MODEL = "claude-opus-5-5";
const NEEDS = "NEEDS_REGINALD";

const MAX_REPLIES_PER_RUN = 3;
const WELCOME_WINDOW_DAYS = 14;
const QUIET_DAYS = 14;
const NUDGE_EVERY_DAYS = 30;
const MAX_NUDGES = 3;
const LOOKBACK_DAYS = 3;
const DAY = 24 * 3600_000;

type Admin = ReturnType<typeof createAdminClient>;
export type OperatorSettings = {
  enabled: boolean;
  welcomes: boolean;
  replies: boolean;
  nudges: boolean;
  milestones: boolean;
  weekly_posts: boolean;
  daily_dm_cap: number;
};
type Member = {
  id: string;
  full_name: string | null;
  bio: string | null;
  headline: string | null;
  industry: string | null;
  location: string | null;
  created_at: string;
  last_active_at: string | null;
};

// ── Who counts as a real member ─────────────────────────────────────────────
/** A human name: at least two words, no mixed-case runs like "olABVvxRPsvGmJGK". */
export function looksLikeRealName(name: string | null | undefined): boolean {
  const n = (name || "").trim();
  if (n.length < 3 || n.length > 60) return false;
  const words = n.split(/\s+/);
  if (words.length < 2) return false;
  return words.every((w) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’.\-]*$/.test(w) && !/[a-z][A-Z].*[A-Z]|[A-Z]{2,}[a-z]+[A-Z]/.test(w));
}

const firstName = (n: string | null) => (n || "").trim().split(/\s+/)[0] || "there";

// ── Chicago-time helpers ────────────────────────────────────────────────────
function chicago(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, weekday: get("weekday") };
}

// ── Voice ───────────────────────────────────────────────────────────────────
export function operatorSystem(bio: string, courses: string): string {
  return `You write as Reginald Reed, founder of The Black Entrepreneurship Society (BES), a community for Black entrepreneurs and business owners at jointhebes.com. Everything you write is posted from Reginald's own account, in the first person, as him.

About Reginald (his own profile): ${bio || "Founder of BES, based in Milwaukee."}

Voice: warm, brief and direct. Plain words, no hype, no hashtags, at most one emoji. Talk like a founder who has been in the work and wants the other person to win. Use their first name.

Rules:
- Never promise money, investment, funding, partnerships, jobs, calls, meetings, or anything at a specific time. Never say you will personally do something later.
- Never invent stories, numbers, events, or things Reginald did. Only refer to what is given to you.
- No individual legal, tax or investment advice. Share general best practice and point to the BES classroom.
- When a course fits, point to it by name with its link. Published courses: ${courses}
- Keep it short: DMs 2–4 sentences, comments 1–3 sentences, posts 3–6 sentences ending with a question.
- If what you are answering needs Reginald's own judgment (money or investment asks, partnership or business offers, complaints or conflict, personal hardship, legal matters, press or speaking requests, anything private or sensitive), output exactly ${NEEDS} and nothing else.
Output only the message text, no quotes or preamble.`;
}

async function generate(system: string, prompt: string): Promise<string | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (r.stop_reason === "refusal") return null;
  const text = r.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  return text || null;
}

// ── Log ─────────────────────────────────────────────────────────────────────
async function log(admin: Admin, action: string, payload: Record<string, unknown>, result: Record<string, unknown> = {}) {
  try {
    await admin.from("automation_log").insert({ action, actor: ACTOR, payload, result });
  } catch {
    /* logging never breaks a run */
  }
}

async function done(admin: Admin, action: string, key: string, value: string, sinceMs?: number) {
  let q = admin.from("automation_log").select("id", { count: "exact", head: true })
    .eq("actor", ACTOR).eq("action", action).eq(`payload->>${key}`, value);
  if (sinceMs) q = q.gte("created_at", new Date(Date.now() - sinceMs).toISOString());
  const { count } = await q;
  return count ?? 0;
}

// ── Settings ────────────────────────────────────────────────────────────────
export async function getOperatorSettings(admin: Admin = createAdminClient()): Promise<OperatorSettings> {
  const { data } = await admin.from("operator_settings").select("*").eq("id", 1).maybeSingle();
  return {
    enabled: data?.enabled ?? true,
    welcomes: data?.welcomes ?? true,
    replies: data?.replies ?? true,
    nudges: data?.nudges ?? true,
    milestones: data?.milestones ?? true,
    weekly_posts: data?.weekly_posts ?? true,
    daily_dm_cap: data?.daily_dm_cap ?? 6,
  };
}

/** Members who are real people: not him, not a persona, not an admin, a human name, and signed in or confirmed. */
async function realMembers(admin: Admin): Promise<Member[]> {
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, bio, headline, industry, location, created_at, last_active_at, role, is_persona")
    .eq("is_persona", false)
    .neq("id", OPERATOR_ID);
  const seen = new Map<string, boolean>();
  for (let page = 1; page < 20; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    for (const u of data?.users ?? []) seen.set(u.id, Boolean(u.last_sign_in_at || u.email_confirmed_at));
    if (!data || data.users.length < 1000) break;
  }
  return (profiles ?? []).filter(
    (p: any) => p.role !== "admin" && looksLikeRealName(p.full_name) && seen.get(p.id),
  ) as Member[];
}

// ── DMs ─────────────────────────────────────────────────────────────────────
async function dmsSentToday(admin: Admin) {
  const { data } = await admin
    .from("automation_log")
    .select("created_at")
    .eq("actor", ACTOR)
    .in("action", ["welcome_dm", "nudge_dm", "milestone_dm"])
    .gte("created_at", new Date(Date.now() - 36 * 3600_000).toISOString());
  const today = chicago().date;
  return (data ?? []).filter((r: any) => chicago(new Date(r.created_at)).date === today).length;
}

async function sendDm(admin: Admin, to: string, body: string) {
  const { data: conv, error } = await admin.rpc("operator_dm", { sender: OPERATOR_ID, other: to });
  if (error || !conv) throw new Error(error?.message || "no conversation");
  await admin.from("messages").insert({ conversation_id: conv, sender_id: OPERATOR_ID, body });
  return conv as string;
}

function profileLine(m: Member) {
  return [
    `Name: ${m.full_name}`,
    m.headline && `Headline: ${m.headline}`,
    m.industry && `Industry: ${m.industry}`,
    m.location && `Location: ${m.location}`,
    m.bio && `Bio: ${m.bio}`,
  ].filter(Boolean).join("\n");
}

// ── Needs you: member DMs to him that are waiting on his reply ──────────────
export async function waitingDms(admin: Admin = createAdminClient()) {
  const { data: mine } = await admin.from("conversation_participants").select("conversation_id").eq("user_id", OPERATOR_ID);
  const out: { conversation_id: string; from: string; body: string; at: string }[] = [];
  for (const c of mine ?? []) {
    const { data: last } = await admin
      .from("messages")
      .select("sender_id, body, created_at, sender:profiles!messages_sender_id_fkey(full_name)")
      .eq("conversation_id", c.conversation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last && last.sender_id !== OPERATOR_ID) {
      const s: any = Array.isArray((last as any).sender) ? (last as any).sender[0] : (last as any).sender;
      out.push({ conversation_id: c.conversation_id, from: s?.full_name ?? "A member", body: last.body, at: last.created_at });
    }
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

// ── The cycle ───────────────────────────────────────────────────────────────
export async function runOperatorCycle(opts: { force?: boolean } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: "ANTHROPIC_API_KEY not set" };
  const admin = createAdminClient();
  const settings = await getOperatorSettings(admin);
  if (!settings.enabled && !opts.force) return { ok: true, skipped: "operator is off" };

  const { data: me } = await admin.from("profiles").select("id, full_name, bio").eq("id", OPERATOR_ID).maybeSingle();
  if (!me) return { ok: false, error: "operator profile not found" };
  const { data: courseRows } = await admin.from("courses").select("slug, title").eq("is_published", true).order("sort_order");
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://jointhebes.com";
  const courses = (courseRows ?? []).map((c: any) => `${c.title} (${site}/classroom/${c.slug})`).join("; ");
  const system = operatorSystem(me.bio || "", courses);

  const members = await realMembers(admin);
  const byId = new Map(members.map((m) => [m.id, m]));
  const actions: string[] = [];
  const needsYou: string[] = [];
  let dmBudget = Math.max(0, settings.daily_dm_cap - (await dmsSentToday(admin)));

  const dm = async (action: string, m: Member, prompt: string, extra: Record<string, unknown> = {}) => {
    if (dmBudget <= 0) return false;
    const body = await generate(system, prompt);
    if (!body) return false;
    if (body.includes(NEEDS)) {
      await log(admin, "needs_you", { member: m.id, about: action, ...extra });
      needsYou.push(`${action} for ${m.full_name}`);
      return false;
    }
    const conv = await sendDm(admin, m.id, body);
    await log(admin, action, { member: m.id, name: m.full_name, ...extra }, { conversation_id: conv, body });
    actions.push(`${action}: ${m.full_name}`);
    dmBudget--;
    return true;
  };

  // 1) Welcomes — real members in their first two weeks who haven't had one.
  if (settings.welcomes) {
    for (const m of members) {
      if (Date.now() - new Date(m.created_at).getTime() > WELCOME_WINDOW_DAYS * DAY) continue;
      if (await done(admin, "welcome_dm", "member", m.id)) continue;
      await dm("welcome_dm", m,
        `Write a welcome DM from you to a new BES member. Thank them for joining, ask one specific question about what they're building, and if their profile suggests it, point to one course that fits. If their profile is empty, ask them to add their industry so you can connect them with the right people.\n\nTheir profile:\n${profileLine(m)}`);
    }
  }

  // 2) Replies — new member posts without a comment from him, and comments on his posts.
  if (settings.replies) {
    let replied = 0;
    const since = new Date(Date.now() - LOOKBACK_DAYS * DAY).toISOString();
    const { data: posts } = await admin
      .from("posts")
      .select("id, title, body, author_id, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40);
    for (const p of posts ?? []) {
      if (replied >= MAX_REPLIES_PER_RUN) break;
      const m = byId.get((p as any).author_id);
      if (!m) continue;
      const { count } = await admin.from("comments").select("id", { count: "exact", head: true })
        .eq("post_id", p.id).eq("author_id", OPERATOR_ID);
      if (count) continue;
      if (await done(admin, "needs_you", "post", p.id)) continue;
      const body = await generate(system,
        `${m.full_name} posted this in the BES community:\n"""${p.title ? p.title + "\n" : ""}${p.body}"""\nWrite your comment on it: encouraging, specific to what they said, and useful.`);
      if (!body) continue;
      if (body.includes(NEEDS)) {
        await log(admin, "needs_you", { post: p.id, member: m.id, name: m.full_name, about: "post" });
        needsYou.push(`post by ${m.full_name}`);
        continue;
      }
      await admin.from("comments").insert({ post_id: p.id, author_id: OPERATOR_ID, body });
      await admin.from("likes").insert({ user_id: OPERATOR_ID, post_id: p.id });
      await log(admin, "post_reply", { post: p.id, member: m.id, name: m.full_name }, { body });
      actions.push(`replied to ${m.full_name}'s post`);
      replied++;
    }

    const { data: myPosts } = await admin.from("posts").select("id, title, body").eq("author_id", OPERATOR_ID)
      .gte("created_at", new Date(Date.now() - 14 * DAY).toISOString());
    for (const mp of myPosts ?? []) {
      if (replied >= MAX_REPLIES_PER_RUN) break;
      const { data: cmts } = await admin.from("comments").select("id, author_id, body, parent_id, created_at")
        .eq("post_id", mp.id).gte("created_at", since).order("created_at");
      for (const c of cmts ?? []) {
        if (replied >= MAX_REPLIES_PER_RUN) break;
        const m = byId.get((c as any).author_id);
        if (!m) continue;
        const answered = (cmts ?? []).some((x: any) => x.parent_id === c.id && x.author_id === OPERATOR_ID);
        if (answered || (await done(admin, "needs_you", "comment", c.id))) continue;
        const body = await generate(system,
          `On your post:\n"""${mp.title ? mp.title + "\n" : ""}${mp.body}"""\n${m.full_name} commented:\n"""${c.body}"""\nWrite your reply to their comment.`);
        if (!body) continue;
        if (body.includes(NEEDS)) {
          await log(admin, "needs_you", { comment: c.id, post: mp.id, member: m.id, name: m.full_name, about: "comment" });
          needsYou.push(`comment by ${m.full_name}`);
          continue;
        }
        await admin.from("comments").insert({ post_id: mp.id, author_id: OPERATOR_ID, parent_id: c.id, body });
        await admin.from("likes").insert({ user_id: OPERATOR_ID, comment_id: c.id });
        await log(admin, "comment_reply", { comment: c.id, post: mp.id, member: m.id, name: m.full_name }, { body });
        actions.push(`replied to ${m.full_name}'s comment`);
        replied++;
      }
    }
  }

  // 3) Milestones — course completion and graduation badges from the last few days.
  if (settings.milestones) {
    const { data: earned } = await admin.from("user_badges")
      .select("user_id, badge_slug, earned_at, badge:badges(name, description)")
      .in("badge_slug", ["course-complete", "scholar", "graduate"])
      .gte("earned_at", new Date(Date.now() - LOOKBACK_DAYS * DAY).toISOString());
    for (const e of earned ?? []) {
      const m = byId.get((e as any).user_id);
      if (!m) continue;
      const key = `${m.id}:${(e as any).badge_slug}`;
      if (await done(admin, "milestone_dm", "milestone", key)) continue;
      const b: any = Array.isArray((e as any).badge) ? (e as any).badge[0] : (e as any).badge;
      await dm("milestone_dm", m,
        `${m.full_name} just earned the "${b?.name ?? (e as any).badge_slug}" badge in BES (${b?.description ?? ""}). Write a short DM congratulating them and suggest the next course that would build on it.\n\nTheir profile:\n${profileLine(m)}`,
        { milestone: key });
    }
  }

  // 4) Nudges — real members quiet for two weeks; once a month, three times at most.
  if (settings.nudges) {
    for (const m of members) {
      if (Date.now() - new Date(m.created_at).getTime() < 7 * DAY) continue;
      const lastSeen = m.last_active_at ? new Date(m.last_active_at).getTime() : 0;
      if (Date.now() - lastSeen < QUIET_DAYS * DAY) continue;
      if (await done(admin, "welcome_dm", "member", m.id, 7 * DAY)) continue;
      if (await done(admin, "nudge_dm", "member", m.id, NUDGE_EVERY_DAYS * DAY)) continue;
      if ((await done(admin, "nudge_dm", "member", m.id)) >= MAX_NUDGES) continue;
      await dm("nudge_dm", m,
        `${m.full_name} joined BES but hasn't been active lately. Write a short, low-pressure DM checking in: ask how the business is going and give one easy reason to come back (a course that fits them, or a thread where they could share what they're working on). No guilt.\n\nTheir profile:\n${profileLine(m)}`);
    }
  }

  // 5) Weekly rhythm — Monday focus post, Friday "Flowers on Friday" post (Chicago time).
  if (settings.weekly_posts) {
    const { date, weekday } = chicago();
    const plan: Record<string, { action: string; slug: string; prompt: string }> = {
      Mon: {
        action: "weekly_monday",
        slug: "lets-talk",
        prompt: "Write this week's Monday post for the BES community: name one practical focus for the week for Black founders (pick something concrete like pricing, one follow-up habit, cash flow review, or asking for referrals), say in a sentence or two why it matters, and end by asking members what they're focusing on this week.",
      },
      Fri: {
        action: "weekly_friday",
        slug: "flowers",
        prompt: "Write this week's \"Flowers on Friday\" post for the BES community: invite members to share one win from the week, big or small, and to give flowers to another founder who helped or inspired them. Keep it upbeat and short, and end with a question.",
      },
    };
    const today = plan[weekday];
    if (today && !(await done(admin, today.action, "date", date))) {
      const { data: recent } = await admin.from("posts").select("body").eq("author_id", OPERATOR_ID)
        .order("created_at", { ascending: false }).limit(4);
      const avoid = (recent ?? []).map((r: any) => "- " + (r.body || "").slice(0, 100)).join("\n");
      const body = await generate(system, `${today.prompt}\nDon't repeat these recent posts of yours:\n${avoid || "(none yet)"}`);
      if (body && !body.includes(NEEDS)) {
        const { data: cat } = await admin.from("categories").select("id").eq("slug", today.slug).maybeSingle();
        const { data: np } = await admin.from("posts").insert({ author_id: OPERATOR_ID, body, category_id: cat?.id ?? null }).select("id").single();
        await log(admin, today.action, { date }, { post_id: np?.id, body });
        actions.push(`${today.action} posted`);
      }
    }
  }

  return { ok: true, realMembers: members.length, dmsLeftToday: dmBudget, actions, needsYou };
}
