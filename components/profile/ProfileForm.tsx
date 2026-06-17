"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/app/Avatar";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  industry: string | null;
  avatar_url: string | null;
};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Upload failed: ${err.message}. Make sure the 'avatars' storage bucket exists.`
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  function onSubmit(formData: FormData) {
    setMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res?.error) setError(res.error);
      else setMsg("Saved.");
    });
  }

  const field =
    "w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none";

  return (
    <form action={onSubmit} className="space-y-4 max-w-xl">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar url={avatarUrl} name={profile.full_name} size={64} />
        <div>
          <label className="inline-block cursor-pointer rounded-lg border border-dark-border px-4 py-2 text-sm text-gray-200 hover:border-gold hover:text-gold transition-all">
            {uploading ? "Uploading..." : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1.5">JPG/PNG, square works best.</p>
        </div>
      </div>
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
        <input name="full_name" defaultValue={profile.full_name ?? ""} className={field} />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Username</label>
        <input name="username" defaultValue={profile.username ?? ""} className={field} placeholder="janefounder" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Industry</label>
        <input name="industry" defaultValue={profile.industry ?? ""} className={field} placeholder="e.g. Real estate, Food & beverage" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Bio</label>
        <textarea name="bio" defaultValue={profile.bio ?? ""} rows={3} className={`${field} resize-none`} placeholder="What do you build?" />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="gold-bg-gradient text-black font-bold rounded-lg px-6 py-2.5 hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        {msg && <span className="text-sm text-green-accent">{msg}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
