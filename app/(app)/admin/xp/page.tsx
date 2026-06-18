import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import LevelEditor from "@/components/admin/LevelEditor";

export const metadata = { title: "XP & Levels | BES" };

export default async function AdminXpPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: levels } = await supabase
    .from("levels")
    .select("level, name, min_xp")
    .order("level");

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gold">
        ← Admin
      </Link>
      <h1
        className="text-2xl font-black mt-1 mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        XP &amp; Levels
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        The Founder Ascension ladder. Each level unlocks at its minimum XP.
      </p>
      <LevelEditor initial={(levels ?? []).map((l) => ({ level: l.level, name: l.name, min_xp: l.min_xp }))} />
    </div>
  );
}
