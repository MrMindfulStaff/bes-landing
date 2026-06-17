import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/app/Avatar";

export const metadata = { title: "Members | BES" };

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, industry, points, level")
    .order("points", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Members
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        The Society leaderboard — points earned by showing up and contributing.
      </p>

      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
        {(members ?? []).map((m, i) => (
          <div key={m.id} className="flex items-center gap-4 p-4">
            <span
              className={`w-6 text-center font-bold ${
                i < 3 ? "text-gold" : "text-gray-600"
              }`}
            >
              {i + 1}
            </span>
            <Avatar url={m.avatar_url} name={m.full_name} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {m.full_name || "Member"}
              </p>
              {m.industry && (
                <p className="text-xs text-gray-500 truncate">{m.industry}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gold font-bold">{m.points}</p>
              <p className="text-xs text-gray-500">Lvl {m.level}</p>
            </div>
          </div>
        ))}
        {(members ?? []).length === 0 && (
          <p className="p-10 text-center text-gray-400">No members yet.</p>
        )}
      </div>
    </div>
  );
}
