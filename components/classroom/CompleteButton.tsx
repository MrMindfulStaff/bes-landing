"use client";

import { useTransition } from "react";
import { toggleLessonComplete } from "@/lib/classroom";

export default function CompleteButton({
  lessonId,
  courseSlug,
  completed,
}: {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() =>
        start(async () => {
          await toggleLessonComplete(lessonId, courseSlug, completed);
        })
      }
      disabled={pending}
      className={`rounded-lg px-5 py-2.5 font-bold transition-all disabled:opacity-50 ${
        completed
          ? "border border-gold text-gold hover:bg-gold/10"
          : "gold-bg-gradient text-black hover:opacity-90"
      }`}
    >
      {pending ? "..." : completed ? "✓ Completed — undo" : "Mark complete"}
    </button>
  );
}
