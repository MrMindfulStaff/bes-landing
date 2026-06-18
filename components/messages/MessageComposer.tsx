"use client";

import { useRef, useTransition } from "react";
import { sendMessage } from "@/lib/actions";

export default function MessageComposer({ conversationId }: { conversationId: string }) {
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          await sendMessage(fd);
          ref.current?.reset();
        })
      }
      className="flex gap-2 mt-4"
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input
        name="body"
        required
        autoComplete="off"
        placeholder="Write a message…"
        className="flex-1 rounded-lg bg-dark-card border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2.5 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
