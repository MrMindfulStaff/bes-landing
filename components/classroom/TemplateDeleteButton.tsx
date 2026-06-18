"use client";

import { useTransition } from "react";
import { deleteTemplate } from "@/lib/actions";

export default function TemplateDeleteButton({
  id,
  courseSlug,
}: {
  id: string;
  courseSlug: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => deleteTemplate(id, courseSlug))}
      disabled={pending}
      className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
