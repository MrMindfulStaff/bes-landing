"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BROADCAST_COOLDOWN_HOURS = Number(process.env.BROADCAST_COOLDOWN_HOURS) || 72;

export type LevelInput = { level: number; name: string; min_xp: number };

/**
 * Replace the XP ladder with the provided set of levels and re-derive every
 * member's level. Admin-only — enforced by RLS on `levels` and by recompute_levels().
 */
export async function saveLevels(levels: LevelInput[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const clean = levels
    .map((l) => ({
      level: Math.round(Number(l.level)),
      name: String(l.name || "").trim(),
      min_xp: Math.max(0, Math.round(Number(l.min_xp) || 0)),
    }))
    .filter((l) => l.name && Number.isFinite(l.level) && l.level >= 1)
    // dedupe by level (last wins) so a duplicate level number can't break the upsert
    .reduce<LevelInput[]>((acc, l) => {
      const i = acc.findIndex((x) => x.level === l.level);
      if (i >= 0) acc[i] = l;
      else acc.push(l);
      return acc;
    }, [])
    .sort((a, b) => a.level - b.level);

  if (clean.length === 0) return { error: "Add at least one level." };
  if (!clean.some((l) => l.min_xp === 0)) {
    return { error: "The first level must start at 0 XP." };
  }

  const { error } = await supabase.from("levels").upsert(clean, { onConflict: "level" });
  if (error) return { error: error.message };

  // Remove any levels the admin deleted.
  const keep = clean.map((l) => l.level);
  const { error: delErr } = await supabase
    .from("levels")
    .delete()
    .not("level", "in", `(${keep.join(",")})`);
  if (delErr) return { error: delErr.message };

  const { error: rpcErr } = await supabase.rpc("recompute_levels");
  if (rpcErr) return { error: rpcErr.message };

  revalidatePath("/admin/xp");
  revalidatePath("/members");
  return { ok: true };
}

// ── Admin broadcasts (announce + email all members, throttled) ───────────────

/** When the next broadcast is allowed (throttle off the last one). */
export async function getBroadcastWindow() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("broadcasts")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const last = data?.created_at ? new Date(data.created_at) : null;
  const nextAllowed = last
    ? new Date(last.getTime() + BROADCAST_COOLDOWN_HOURS * 3600_000)
    : null;
  const canSend = !nextAllowed || nextAllowed.getTime() <= Date.now();
  return {
    canSend,
    nextAllowedISO: nextAllowed ? nextAllowed.toISOString() : null,
    cooldownHours: BROADCAST_COOLDOWN_HOURS,
    emailEnabled: Boolean(process.env.RESEND_API_KEY),
  };
}

function renderBroadcastEmail(body: string) {
  const safe = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#0d0d0d;margin:0 0 16px">The Black Entrepreneurship Society</h2>
  <div style="font-size:15px;line-height:1.6">${safe}</div>
  <p style="margin:28px 0"><a href="https://jointhebes.com/community" style="background:#c9a84c;color:#0d0d0d;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Open the community →</a></p>
  <p style="color:#888;font-size:12px;border-top:1px solid #eee;padding-top:16px">You're receiving this because you're a member of The Black Entrepreneurship Society.</p>
</div>`;
}

/** Email every member via Resend. No-op (with a note) if RESEND_API_KEY is unset. */
async function emailAllMembers(subject: string, body: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { sent: 0, note: "Email skipped — add RESEND_API_KEY (+ verified domain) to enable it. The post and in-app alerts still went out." };
  }
  const from =
    process.env.BROADCAST_FROM ||
    "The Black Entrepreneurship Society <team@jointhebes.com>";

  const admin = createAdminClient();
  const emails: string[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    data.users.forEach((u) => {
      if (u.email) emails.push(u.email);
    });
    if (data.users.length < 200) break;
  }
  if (emails.length === 0) return { sent: 0, note: "No member emails found." };

  const html = renderBroadcastEmail(body);
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100).map((to) => ({ from, to: [to], subject, html }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (res.ok) sent += batch.length;
  }
  return {
    sent,
    note: sent ? undefined : "Email send failed — check RESEND_API_KEY and that your from-domain is verified in Resend.",
  };
}

/** Post an announcement to the feed, notify every member in-app, optionally email them all. */
export async function sendBroadcast(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: "Admins only." };

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const alsoEmail = formData.get("email") === "on";
  if (!body) return { error: "Write a message first." };

  const win = await getBroadcastWindow();
  if (!win.canSend) {
    return {
      error: `You can send the next broadcast after ${new Date(
        win.nextAllowedISO!,
      ).toLocaleString()} (every ${win.cooldownHours}h).`,
    };
  }

  const { data, error } = await supabase.rpc("create_broadcast", {
    p_title: title || null,
    p_body: body,
    p_pin: true,
  });
  if (error) return { error: error.message };
  const result = Array.isArray(data) ? data[0] : data;
  const recipients = result?.recipients ?? 0;

  let emailed = 0;
  let emailNote: string | undefined;
  if (alsoEmail) {
    const r = await emailAllMembers(title || "New from The Black Entrepreneurship Society", body);
    emailed = r.sent;
    emailNote = r.note;
    if (result?.broadcast_id && emailed) {
      await createAdminClient()
        .from("broadcasts")
        .update({ email_count: emailed })
        .eq("id", result.broadcast_id);
    }
  }

  revalidatePath("/community");
  revalidatePath("/admin/broadcast");
  return { ok: true, recipients, emailed, emailNote };
}
