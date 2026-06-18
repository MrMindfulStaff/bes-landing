"use client";

import { useRef, useState, useTransition } from "react";
import { createEvent } from "@/lib/actions";

export default function AddEvent() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  const field =
    "w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 gold-bg-gradient text-black font-bold rounded-lg px-5 py-2 text-sm hover:opacity-90"
      >
        + New event
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          const r = await createEvent(fd);
          if (r?.error) setError(r.error);
          else {
            ref.current?.reset();
            setOpen(false);
          }
        })
      }
      className="rounded-xl bg-dark-card border border-dark-border p-5 mb-6 space-y-3"
    >
      <h2 className="font-bold text-white">New event</h2>
      <input name="title" required placeholder="Event title" className={field} />
      <textarea name="description" rows={3} placeholder="Description (optional)" className={`${field} resize-none`} />
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm text-gray-400">
          Starts
          <input name="starts_at" type="datetime-local" required className={`${field} mt-1`} />
        </label>
        <label className="text-sm text-gray-400">
          Ends (optional)
          <input name="ends_at" type="datetime-local" className={`${field} mt-1`} />
        </label>
      </div>
      <input name="location" placeholder="Location or link (Zoom, address…)" className={field} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2 text-sm disabled:opacity-50">
          {pending ? "Creating…" : "Create event"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}
