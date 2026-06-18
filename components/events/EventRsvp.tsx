"use client";

import { useState, useTransition } from "react";
import { rsvpEvent } from "@/lib/actions";

const OPTS: { val: "going" | "maybe" | "declined"; label: string }[] = [
  { val: "going", label: "Going" },
  { val: "maybe", label: "Maybe" },
  { val: "declined", label: "Can't go" },
];

export default function EventRsvp({
  eventId,
  myStatus,
}: {
  eventId: string;
  myStatus: string | null;
}) {
  const [status, setStatus] = useState(myStatus);
  const [pending, start] = useTransition();

  return (
    <div className="flex gap-2 flex-wrap">
      {OPTS.map((o) => (
        <button
          key={o.val}
          disabled={pending}
          onClick={() =>
            start(async () => {
              setStatus(o.val);
              await rsvpEvent(eventId, o.val);
            })
          }
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all disabled:opacity-50 ${
            status === o.val
              ? "gold-bg-gradient text-black"
              : "border border-dark-border text-gray-300 hover:border-gold hover:text-gold"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
