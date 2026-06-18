import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/app/Avatar";
import { levelName } from "@/lib/levels";

export const metadata = { title: "Members | BES" };

const TABS = [
  { key: "all", label: "All-time", days: 0 },
  { key: "30", label: "30 days", days: 30 },
  { key: "7", label: "7 days", days: 7 },
] as const;

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  industry: string | null;
  level: number;
  xp: number;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const active = TABS.find((t) => t.key === range) ?? TABS[0];

  const supabase = await createClient();
  const { data } = await supabase.rpc("leaderboard", { days: active.days, lim: 100 });
  const members = (data ?? []) as Row[];

  return (
    <div>
      <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Members
      </h1>
      <p className="text-gray-500 text-sm mb-4">
        The leaderboard — XP earned by showing up, contributing, and learning.
      </p>

      <div className="flex gap-1 border-b border-dark-border mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/members?range=${t.key}`}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              active.key === t.key
                ? "border-gold text-gold"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
        {members.map((m, i) => (
          <Link
            key={m.id}
            href={`/members/${m.id}`}
            className="flex items-center gap-4 p-4 hover:bg-dark/40 transition-colors"
          >
            <span className={`w-6 text-center font-bold ${i < 3 ? "text-gold" : "text-gray-600"}`}>
              {i + 1}
            </span>
            <Avatar url={m.avatar_url} name={m.full_name} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{m.full_name || "Member"}</p>
              <p className="text-xs text-gray-500 truncate">
                {levelName(m.level)}
                {m.industry ? ` · ${m.industry}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gold font-bold">{m.xp}</p>
              <p className="text-xs text-gray-500">{active.key === "all" ? "XP" : "XP " + active.label}</p>
            </div>
          </Link>
        ))}
        {members.length === 0 && <p className="p-10 text-center text-gray-400">No members yet.</p>}
      </div>
    </div>
  );
}
