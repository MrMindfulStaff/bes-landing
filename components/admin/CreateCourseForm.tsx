"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/lib/classroom";

export default function CreateCourseForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2.5"
      >
        + New classroom
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          setError(null);
          const r = await createCourse(fd);
          if (r?.error) setError(r.error);
          else if (r?.slug) router.push(`/admin/courses/${r.slug}`);
        })
      }
      className="rounded-xl bg-dark-card border border-dark-border p-5 space-y-3"
    >
      <input
        name="title"
        required
        placeholder="Classroom title (e.g. Sales & Customer Acquisition)"
        className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
      />
      <input
        name="subtitle"
        placeholder="Subtitle (optional)"
        className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Description (optional)"
        className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
      />
      <input
        name="cover_url"
        placeholder="Cover image URL (optional)"
        className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
      />
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" name="is_published" className="accent-gold" />
        Publish immediately (otherwise saved as a draft)
      </label>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2.5 disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create classroom"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-dark-border px-4 py-2.5 text-gray-300 hover:border-gold"
        >
          Cancel
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
