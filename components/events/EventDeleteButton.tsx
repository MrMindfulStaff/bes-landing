"use client";

import { useTransition } from "react";
import { deleteEvent } from "@/lib/actions";

export default function EventDeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => deleteEvent(id))}
      disabled={pending}
      className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
