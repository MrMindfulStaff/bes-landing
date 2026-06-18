import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBroadcastWindow } from "@/lib/admin";
import BroadcastComposer from "@/components/admin/BroadcastComposer";

export const metadata = { title: "Broadcast | BES" };

export default async function AdminBroadcastPage() {
  await requireAdmin();
  const supabase = await createClient();
  const window = await getBroadcastWindow();
  const { data: recent } = await supabase
    .from("broadcasts")
    .select("id, title, body, recipient_count, email_count, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gold">
        ← Admin
      </Link>
      <h1
        className="text-2xl font-black mt-1 mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Broadcast
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Post an announcement to the whole community, notify every member in-app, and email them —
        all at once. One every {window.cooldownHours} hours.
      </p>

      <BroadcastComposer
        canSend={window.canSend}
        nextAllowedISO={window.nextAllowedISO}
        cooldownHours={window.cooldownHours}
        emailEnabled={window.emailEnabled}
      />

      {(recent ?? []).length > 0 && (
        <>
          <h2 className="font-bold text-white mt-8 mb-3">Recent broadcasts</h2>
          <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
            {(recent ?? []).map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200">{b.title || "Announcement"}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(b.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{b.body}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {b.recipient_count} notified · {b.email_count} emailed
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
