"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to feed changes and refreshes server data so new posts,
 * comments, and likes appear live without a manual reload.
 */
export default function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feed-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () =>
        router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
