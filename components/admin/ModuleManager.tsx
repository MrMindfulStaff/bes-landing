"use client";

import { useRef, useState, useTransition } from "react";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  deleteModule,
} from "@/lib/classroom";

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  drip_days: number;
  is_published: boolean;
  sort_order: number;
};
type ModuleRow = { id: string; title: string; lessons: Lesson[] };

const field =
  "w-full rounded-lg bg-dark border border-dark-border px-3 py-2 text-sm text-white focus:border-gold focus:outline-none";

function LessonForm({
  moduleId,
  courseSlug,
  lesson,
  nextOrder,
  onDone,
}: {
  moduleId: string;
  courseSlug: string;
  lesson?: Lesson;
  nextOrder: number;
  onDone: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  const editing = Boolean(lesson);

  return (
    <form
      ref={ref}
      action={(fd) =>
        start(async () => {
          const r = editing ? await updateLesson(fd) : await createLesson(fd);
          if (r?.error) setError(r.error);
          else {
            if (!editing) ref.current?.reset();
            onDone();
          }
        })
      }
      className="space-y-2 rounded-lg bg-dark/50 border border-dark-border p-3 mt-2"
    >
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="course_slug" value={courseSlug} />
      <input type="hidden" name="sort_order" value={lesson?.sort_order ?? nextOrder} />
      {editing && <input type="hidden" name="id" value={lesson!.id} />}

      <input name="title" required defaultValue={lesson?.title ?? ""} placeholder="Lesson title" className={field} />
      <textarea name="content" rows={4} defaultValue={lesson?.content ?? ""} placeholder="Lesson content (text / markdown)" className={`${field} resize-y`} />
      <div className="flex flex-wrap gap-2">
        <input name="video_url" defaultValue={lesson?.video_url ?? ""} placeholder="Video URL (YouTube/Vimeo, optional)" className={`${field} flex-1 min-w-[200px]`} />
        <input name="drip_days" type="number" min={0} defaultValue={lesson?.drip_days ?? 0} title="Unlock N days after enrollment" className={`${field} w-28`} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" name="is_published" defaultChecked={lesson?.is_published ?? false} />
        Published
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="gold-bg-gradient text-black font-bold rounded-lg px-4 py-1.5 text-sm disabled:opacity-50">
          {pending ? "..." : editing ? "Save" : "Add lesson"}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-white">
            Cancel
          </button>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}

export default function ModuleManager({
  module,
  courseSlug,
}: {
  module: ModuleRow;
  courseSlug: string;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();
  const lessons = [...module.lessons].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="rounded-xl bg-dark-card border border-dark-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-white">{module.title}</h3>
        <button
          onClick={() => start(() => deleteModule(module.id, courseSlug))}
          className="text-xs text-gray-500 hover:text-red-400"
        >
          Delete module
        </button>
      </div>

      <div className="space-y-1">
        {lessons.map((l) => (
          <div key={l.id}>
            <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-dark/40">
              <span className="flex-1 text-sm text-gray-200">
                {l.title}
                {!l.is_published && <span className="ml-2 text-xs text-gray-500">(draft)</span>}
                {l.drip_days > 0 && <span className="ml-2 text-xs text-gray-600">🔒 day {l.drip_days}</span>}
              </span>
              <button onClick={() => setEditId(editId === l.id ? null : l.id)} className="text-xs text-gold hover:underline">
                {editId === l.id ? "Close" : "Edit"}
              </button>
              <button
                onClick={() => start(() => deleteLesson(l.id, courseSlug))}
                className="text-xs text-gray-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
            {editId === l.id && (
              <LessonForm
                moduleId={module.id}
                courseSlug={courseSlug}
                lesson={l}
                nextOrder={l.sort_order}
                onDone={() => setEditId(null)}
              />
            )}
          </div>
        ))}
        {lessons.length === 0 && (
          <p className="text-sm text-gray-600 px-2 py-1">No lessons yet.</p>
        )}
      </div>

      {adding ? (
        <LessonForm
          moduleId={module.id}
          courseSlug={courseSlug}
          nextOrder={lessons.length}
          onDone={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 text-sm text-gold hover:underline"
        >
          + Add lesson
        </button>
      )}
    </div>
  );
}
