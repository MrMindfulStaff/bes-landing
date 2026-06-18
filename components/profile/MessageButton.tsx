"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { startDm } from "@/lib/actions";

export default function MessageButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await startDm(targetId);
          if (r?.id) {
            router.push(`/messages/${r.id}`);
          }
        })
      }
      className="rounded-lg border border-dark-border px-5 py-2 font-bold text-gray-200 hover:border-gold hover:text-gold transition-all disabled:opacity-50"
    >
      Message
    </button>
  );
}
