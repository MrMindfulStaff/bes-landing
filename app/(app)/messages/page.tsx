import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/app/Avatar";

export const metadata = { title: "Messages | BES" };

type Profile = { id: string; full_name: string | null; avatar_url: string | null };
type Msg = { conversation_id: string; sender_id: string; body: string; created_at: string };

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function MessagesPage() {
  const me = await getProfile();
  if (!me) return null;
  const supabase = await createClient();

  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", me.id);
  const convIds = (parts ?? []).map((p) => p.conversation_id);

  const header = (
    <>
      <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Messages
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Direct messages with members. Start one from any member&apos;s profile —{" "}
        <Link href="/members" className="text-gold hover:underline">browse members</Link>.
      </p>
    </>
  );

  if (!convIds.length) {
    return (
      <div className="max-w-2xl">
        {header}
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">No conversations yet. ✉️</p>
        </div>
      </div>
    );
  }

  const lastRead: Record<string, string> = {};
  for (const p of parts!) lastRead[p.conversation_id] = p.last_read_at;

  const [othersRes, msgsRes] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, profile:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url)")
      .in("conversation_id", convIds)
      .neq("user_id", me.id),
    supabase
      .from("messages")
      .select("conversation_id, sender_id, body, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
  ]);

  const otherByConv: Record<string, Profile> = {};
  for (const o of (othersRes.data ?? []) as unknown as { conversation_id: string; profile: Profile | Profile[] }[]) {
    const prof = Array.isArray(o.profile) ? o.profile[0] : o.profile;
    if (prof && !otherByConv[o.conversation_id]) otherByConv[o.conversation_id] = prof;
  }
  const lastByConv: Record<string, Msg> = {};
  for (const m of (msgsRes.data ?? []) as Msg[]) {
    if (!lastByConv[m.conversation_id]) lastByConv[m.conversation_id] = m;
  }

  const list = convIds
    .map((cid) => ({ cid, other: otherByConv[cid], last: lastByConv[cid], lr: lastRead[cid] }))
    .filter((c) => c.last)
    .sort((a, b) => new Date(b.last!.created_at).getTime() - new Date(a.last!.created_at).getTime());

  return (
    <div className="max-w-2xl">
      {header}
      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border overflow-hidden">
        {list.map(({ cid, other, last, lr }) => {
          const unread = last!.sender_id !== me.id && (!lr || new Date(last!.created_at) > new Date(lr));
          return (
            <Link key={cid} href={`/messages/${cid}`} className="flex items-center gap-3 p-4 hover:bg-dark/40">
              <Avatar url={other?.avatar_url} name={other?.full_name} size={44} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate ${unread ? "font-bold text-white" : "font-semibold text-gray-200"}`}>
                    {other?.full_name || "Member"}
                  </p>
                  <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo(last!.created_at)}</span>
                </div>
                <p className={`text-sm truncate ${unread ? "text-gray-200" : "text-gray-500"}`}>
                  {last!.sender_id === me.id ? "You: " : ""}
                  {last!.body}
                </p>
              </div>
              {unread && <span className="w-2.5 h-2.5 rounded-full bg-gold flex-shrink-0" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
