import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOperatorSettings, waitingDms } from "@/lib/operator";
import { saveOperatorSettings, runOperatorNow } from "@/lib/operator-actions";

export const metadata = { title: "Operator | BES" };
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LABEL: Record<string, string> = {
  welcome_dm: "Welcome DM",
  nudge_dm: "Check-in DM",
  milestone_dm: "Congrats DM",
  post_reply: "Commented on a post",
  comment_reply: "Replied to a comment",
  weekly_monday: "Monday focus post",
  weekly_friday: "Flowers on Friday post",
  needs_you: "Left for you",
};
const TOGGLES: [string, string][] = [
  ["welcomes", "Welcome DMs to new members (first two weeks)"],
  ["replies", "Comment on member posts, reply to comments on yours"],
  ["milestones", "Congratulate course completions and graduation"],
  ["nudges", "Check in with members quiet for two weeks (monthly, 3 max)"],
  ["weekly_posts", "Monday focus post and Flowers on Friday post"],
];
const when = (s: string) =>
  new Date(s).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function OperatorPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const settings = await getOperatorSettings(admin);
  const waiting = await waitingDms(admin);
  const { data: log } = await admin
    .from("automation_log")
    .select("id, action, payload, result, created_at")
    .eq("actor", "operator")
    .order("created_at", { ascending: false })
    .limit(50);
  const left = (log ?? []).filter((r: any) => r.action === "needs_you");
  const s = settings as Record<string, any>;

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gold">← Admin</Link>
      <h1 className="text-2xl font-black mt-1 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Operator
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Runs BES as you, from your own account, twice a day (8:30 am and 4:30 pm Central). It only acts for real
        members (never spam signups, the BES Mentors or admins), and anything that needs your judgment is left here
        for you instead of answered.
      </p>

      <h2 className="font-bold text-white mb-3">Needs you</h2>
      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border mb-6">
        {waiting.length === 0 && left.length === 0 && <p className="p-4 text-sm text-gray-500">Nothing waiting on you.</p>}
        {waiting.map((w) => (
          <Link key={w.conversation_id} href={`/messages/${w.conversation_id}`} className="block p-4 hover:bg-white/5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-200">{w.from} messaged you</span>
              <span className="text-gray-500">{when(w.at)}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{w.body}</p>
          </Link>
        ))}
        {left.map((r: any) => (
          <div key={r.id} className="p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-200">
                Left for you: {r.payload?.about ?? "item"} from {r.payload?.name ?? "a member"}
              </span>
              <span className="text-gray-500">{when(r.created_at)}</span>
            </div>
            {r.payload?.post && (
              <Link href={`/community`} className="text-gold text-xs">Open the community →</Link>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-bold text-white mb-3">Settings</h2>
      <form action={saveOperatorSettings} className="rounded-xl bg-dark-card border border-dark-border p-4 mb-3 space-y-3">
        <label className="flex items-center gap-3 text-gray-200 font-semibold">
          <input type="checkbox" name="enabled" defaultChecked={settings.enabled} /> Operator on
        </label>
        {TOGGLES.map(([k, label]) => (
          <label key={k} className="flex items-center gap-3 text-sm text-gray-300 pl-6">
            <input type="checkbox" name={k} defaultChecked={Boolean(s[k])} /> {label}
          </label>
        ))}
        <label className="flex items-center gap-3 text-sm text-gray-300 pl-6">
          DMs per day, at most
          <input type="number" name="daily_dm_cap" min={0} max={25} defaultValue={settings.daily_dm_cap}
            className="w-16 rounded bg-black/40 border border-dark-border px-2 py-1" />
        </label>
        <button className="rounded-lg bg-gold text-black font-semibold px-4 py-2 text-sm">Save</button>
      </form>
      <form action={runOperatorNow} className="mb-8">
        <button className="rounded-lg border border-gold text-gold px-4 py-2 text-sm">Run now</button>
      </form>

      <h2 className="font-bold text-white mb-3">What it did</h2>
      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
        {(log ?? []).filter((r: any) => r.action !== "needs_you").length === 0 && (
          <p className="p-4 text-sm text-gray-500">Nothing yet.</p>
        )}
        {(log ?? []).filter((r: any) => r.action !== "needs_you").map((r: any) => (
          <div key={r.id} className="p-4">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-200">
                {LABEL[r.action] ?? r.action}{r.payload?.name ? ` · ${r.payload.name}` : ""}
              </span>
              <span className="text-gray-500">{when(r.created_at)}</span>
            </div>
            {r.result?.body && <p className="text-sm text-gray-400 mt-1 whitespace-pre-line">{r.result.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
