import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/app/Avatar";

export const metadata = { title: "Notifications | BES" };

type Notif = {
  id: string;
  type: string;
  read_at: string | null;
  created_at: string;
  data: { message?: string; href?: string; actor_name?: string; actor_avatar?: string };
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_ICON: Record<string, string> = {
  reply: "💬", like: "❤️", follow: "🤝", badge: "🏅", mention: "📣", dm: "✉️",
  event: "📅", challenge: "🎯", system: "🔔", welcome: "👋",
};

export default async function NotificationsPage() {
  const me = await getProfile();
  if (!me) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, read_at, created_at, data")
    .eq("user_id", me.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const notifs = (data ?? []) as Notif[];

  // Mark everything read once viewed.
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", me.id).is("read_at", null);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
        Notifications
      </h1>
      <p className="text-gray-500 text-sm mb-6">What you missed in the Society.</p>

      {notifs.length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">No notifications yet. 🔔</p>
        </div>
      ) : (
        <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border overflow-hidden">
          {notifs.map((n) => {
            const inner = (
              <div className={`flex items-center gap-3 p-4 ${n.read_at ? "" : "bg-gold/5"}`}>
                {n.data.actor_name ? (
                  <Avatar url={n.data.actor_avatar} name={n.data.actor_name} size={40} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">
                    {n.data.actor_name && <span className="font-semibold text-white">{n.data.actor_name} </span>}
                    {n.data.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />}
              </div>
            );
            return n.data.href ? (
              <Link key={n.id} href={n.data.href} className="block hover:bg-dark/40">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
