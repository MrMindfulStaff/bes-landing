"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runOperatorCycle } from "@/lib/operator";

const FLAGS = ["enabled", "welcomes", "replies", "nudges", "milestones", "weekly_posts"] as const;

export async function saveOperatorSettings(formData: FormData) {
  await requireAdmin();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of FLAGS) row[f] = formData.get(f) === "on";
  const cap = Number(formData.get("daily_dm_cap"));
  row.daily_dm_cap = Number.isFinite(cap) ? Math.min(25, Math.max(0, Math.round(cap))) : 6;
  await createAdminClient().from("operator_settings").update(row).eq("id", 1);
  revalidatePath("/admin/operator");
}

export async function runOperatorNow() {
  await requireAdmin();
  await runOperatorCycle({ force: true });
  revalidatePath("/admin/operator");
}
