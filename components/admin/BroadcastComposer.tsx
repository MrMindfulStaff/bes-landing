"use client";

import { useRef, useState, useTransition } from "react";
import { sendBroadcast } from "@/lib/admin";

export default function BroadcastComposer({
  canSend,
  nextAllowedISO,
  cooldownHours,
  emailEnabled,
}: {
  canSend: boolean;
  nextAllowedISO: string | null;
  cooldownHours: number;
  emailEnabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  const blocked = !canSend;

  function submit(fd: FormData) {
    start(async () => {
      setResult(null);
      const r = await sendBroadcast(fd);
      if (r?.error) setResult({ ok: false, text: r.error });
      else {
        const bits = [`Announcement posted · ${r.recipients} members notified in-app`];
        if (fd.get("email") === "on") {
          bits.push(r.emailed ? `${r.emailed} emailed` : r.emailNote || "email not sent");
        }
        setResult({ ok: true, text: bits.join(" · ") });
        ref.current?.reset();
      }
      setConfirming(false);
    });
  }

  return (
    <form
      ref={ref}
      action={submit}
      onSubmit={(e) => {
        if (!confirming) {
          e.preventDefault();
          setConfirming(true);
        }
      }}
      className="rounded-xl bg-dark-card border border-dark-border p-5 space-y-3"
    >
      {blocked && (
        <div className="rounded-lg bg-dark border border-dark-border px-4 py-3 text-sm text-gray-300">
          ⏳ Next broadcast available{" "}
          <span className="text-gold font-semibold">
            {nextAllowedISO ? new Date(nextAllowedISO).toLocaleString() : "now"}
          </span>{" "}
          <span className="text-gray-500">(one every {cooldownHours}h)</span>
        </div>
      )}

      <input
        name="title"
        placeholder="Headline (optional)"
        disabled={blocked || pending}
        className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none disabled:opacity-50"
      />
      <textarea
        name="body"
        required
        rows={5}
        placeholder="Write your announcement to all members…"
        disabled={blocked || pending}
        className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none disabled:opacity-50"
      />
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" name="email" defaultChecked={emailEnabled} disabled={blocked || pending} className="accent-gold" />
        Also email every member
        {!emailEnabled && (
          <span className="text-xs text-gray-500">(email provider not configured yet — see note below)</span>
        )}
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={blocked || pending}
          className={`rounded-lg px-5 py-2.5 font-bold disabled:opacity-50 ${
            confirming ? "bg-red-500 text-white" : "gold-bg-gradient text-black"
          }`}
        >
          {pending
            ? "Sending…"
            : confirming
              ? "Click again to confirm — this goes to ALL members"
              : "Post announcement"}
        </button>
        {confirming && !pending && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-gray-400 hover:text-gold"
          >
            Cancel
          </button>
        )}
        {result && (
          <span className={`text-sm ${result.ok ? "text-gold" : "text-red-400"}`}>{result.text}</span>
        )}
      </div>
      {!emailEnabled && (
        <p className="text-xs text-gray-500">
          To email members, add <code className="text-gray-400">RESEND_API_KEY</code> (and{" "}
          <code className="text-gray-400">BROADCAST_FROM</code>) in Vercel and verify your sending
          domain in Resend. Until then, announcements still post to the feed and notify everyone
          in-app.
        </p>
      )}
    </form>
  );
}
