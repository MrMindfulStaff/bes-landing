"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell({ userId }: { userId: string }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
      setCount(count ?? 0);
    };
    load();
    const ch = supabase
      .channel("notif-bell")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, pathname]);

  return (
    <Link
      href="/notifications"
      className="relative text-lg text-gray-300 hover:text-gold transition-colors"
      aria-label="Notifications"
    >
      🔔
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full gold-bg-gradient text-black text-[10px] font-bold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
