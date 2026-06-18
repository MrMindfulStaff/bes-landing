"use client";

import { useRef, useState, useTransition } from "react";
import { createCategory } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";

const COLORS = ["#c9a84c", "#2d8a4e", "#3b82f6", "#eab308", "#a855f7", "#ef4444", "#06b6d4", "#f59e0b"];

export default function AddThreadTile() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [coverUrl, setCoverUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `threads/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("post-media").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("post-media").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const r = await createCategory(fd);
      if (r?.error) setError(r.error);
      else {
        ref.current?.reset();
        setCoverUrl("");
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="aspect-[4/3] rounded-xl border-2 border-dashed border-dark-border flex flex-col items-center justify-center text-gray-500 hover:border-gold hover:text-gold transition-all"
      >
        <span className="text-3xl">＋</span>
        <span className="text-sm font-semibold mt-1">New thread</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-dark-card border border-dark-border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">New thread</h2>
            <form ref={ref} action={submit} className="space-y-4">
              {/* Live tile preview */}
              <div
                className="relative h-24 rounded-lg overflow-hidden border border-dark-border"
                style={
                  coverUrl
                    ? undefined
                    : { background: `linear-gradient(135deg, ${color} 0%, #0d0d0d 95%)` }
                }
              >
                {coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>

              <input
                name="name"
                required
                placeholder="Thread name"
                className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none"
              />
              <input
                name="description"
                placeholder="Short description (optional)"
                className="w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
              />

              <div>
                <p className="text-xs text-gray-400 mb-1.5">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full ${color === c ? "ring-2 ring-white" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <label className="inline-block cursor-pointer rounded-lg border border-dark-border px-4 py-2 text-sm text-gray-200 hover:border-gold hover:text-gold transition-all">
                {uploading ? "Uploading..." : coverUrl ? "Change picture" : "Upload picture (optional)"}
                <input type="file" accept="image/*" onChange={onCover} disabled={uploading} className="hidden" />
              </label>

              <input type="hidden" name="color" value={color} />
              <input type="hidden" name="cover_url" value={coverUrl} />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || uploading}
                  className="gold-bg-gradient text-black font-bold rounded-lg px-5 py-2 text-sm disabled:opacity-50"
                >
                  {pending ? "Creating..." : "Create thread"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
