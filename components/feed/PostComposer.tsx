"use client";

import { useRef, useState, useTransition } from "react";
import { createPost } from "@/lib/actions";
import Avatar from "@/components/app/Avatar";

type Category = { id: string; name: string; icon: string | null };

export default function PostComposer({
  categories = [],
  profile,
  fixedCategory,
}: {
  categories?: Category[];
  profile: { full_name: string | null; avatar_url: string | null } | null;
  fixedCategory?: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createPost(formData);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  return (
    <div className="rounded-xl bg-dark-card border border-dark-border p-4 mb-6">
      <div className="flex items-center gap-3">
        <Avatar url={profile?.avatar_url} name={profile?.full_name} size={40} />
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left text-gray-500 bg-dark rounded-lg px-4 py-2.5 border border-dark-border hover:border-gold/50 transition-colors"
          >
            Share a win, ask a question, drop a resource...
          </button>
        ) : (
          <span className="text-sm text-gray-400">New post</span>
        )}
      </div>

      {open && (
        <form ref={formRef} action={onSubmit} className="mt-3 space-y-3">
          <input
            name="title"
            placeholder="Title (optional)"
            className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
          />
          <textarea
            name="body"
            required
            rows={4}
            autoFocus
            placeholder="What's on your mind?"
            className="w-full rounded-lg bg-dark border border-dark-border px-4 py-3 text-white focus:border-gold focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {fixedCategory ? (
              <>
                <input type="hidden" name="category_id" value={fixedCategory.id} />
                <span className="text-xs text-gray-500">
                  Posting in <span className="text-gold">{fixedCategory.name}</span>
                </span>
              </>
            ) : (
              <select
                name="category_id"
                className="rounded-lg bg-dark border border-dark-border px-3 py-2 text-sm text-gray-300 focus:border-gold focus:outline-none"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2 text-sm hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}
