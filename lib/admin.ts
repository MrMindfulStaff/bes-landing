"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
