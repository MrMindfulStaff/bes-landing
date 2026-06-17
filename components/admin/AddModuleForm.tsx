"use client";

import { useRef, useState, useTransition } from "react";
import { createModule } from "@/lib/classroom";

export default function AddModuleForm({
  courseId,
  courseSlug,
  nextOrder,
}: {
  courseId: string;
  courseSlug: string;
  nextOrder: number;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          const r = await createModule(fd);
          if (r?.error) setError(r.error);
          else ref.current?.reset();
        })
      }
      className="flex items-center gap-2 mb-6"
    >
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="course_slug" value={courseSlug} />
      <input type="hidden" name="sort_order" value={nextOrder} />
      <input
        name="title"
        required
        placeholder="New module title..."
        className="flex-1 rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2.5 disabled:opacity-50"
      >
        {pending ? "..." : "Add module"}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </form>
  );
}
