"use client";

import { useRef, useState, useTransition } from "react";
import { createTemplate } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

export default function AddTemplate({
  courseId,
  courseSlug,
}: {
  courseId: string;
  courseSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `templates/${courseId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("course-media")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("course-media").getPublicUrl(path);
      setFileUrl(data.publicUrl);
      setFileName(file.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const r = await createTemplate(fd);
      if (r?.error) setError(r.error);
      else {
        ref.current?.reset();
        setFileUrl("");
        setFileName("");
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 text-sm text-gold hover:underline"
      >
        + Add template
      </button>
    );
  }

  const field =
    "w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none";

  return (
    <form ref={ref} action={submit} className="rounded-xl bg-dark-card border border-dark-border p-4 mb-4 space-y-3">
      <input name="course_id" type="hidden" value={courseId} />
      <input name="course_slug" type="hidden" value={courseSlug} />
      <input name="file_url" type="hidden" value={fileUrl} />
      <input name="file_name" type="hidden" value={fileName} />

      <input name="title" required placeholder="Template name (e.g. Operating Agreement)" className={field} />
      <input name="description" placeholder="Short description (optional)" className={field} />

      <label className="inline-block cursor-pointer rounded-lg border border-dark-border px-4 py-2 text-sm text-gray-200 hover:border-gold hover:text-gold transition-all">
        {uploading ? "Uploading..." : fileName ? `✓ ${fileName}` : "Choose file"}
        <input type="file" onChange={onFile} disabled={uploading} className="hidden" />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || uploading || !fileUrl}
          className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add template"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}
