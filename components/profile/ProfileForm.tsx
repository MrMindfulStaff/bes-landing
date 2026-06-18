"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/app/Avatar";
import CoverEditor from "@/components/profile/CoverEditor";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  headline: string | null;
  bio: string | null;
  industry: string | null;
  location: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  cover_position: number | null;
};

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(profile.cover_url ?? "");
  const [coverPos, setCoverPos] = useState(profile.cover_position ?? 50);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);

  async function upload(file: File, kind: "avatar" | "cover") {
    setUploading(kind);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (kind === "avatar") setAvatarUrl(data.publicUrl);
      else setCoverUrl(data.publicUrl);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : "Upload failed."
      );
    } finally {
      setUploading(null);
    }
  }

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res?.error) setError(res.error);
      else {
        router.push("/profile");
        router.refresh();
      }
    });
  }

  const field =
    "w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none";

  return (
    <form action={onSubmit} className="space-y-5 max-w-xl">
      {/* Cover */}
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Cover photo</label>
        <CoverEditor coverUrl={coverUrl} pos={coverPos} onPosChange={setCoverPos} />
        <label className="inline-block mt-2 cursor-pointer rounded-lg border border-dark-border px-4 py-2 text-sm text-gray-200 hover:border-gold hover:text-gold transition-all">
          {uploading === "cover" ? "Uploading..." : coverUrl ? "Change cover" : "Upload cover"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")}
            disabled={uploading !== null}
            className="hidden"
          />
        </label>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar url={avatarUrl} name={profile.full_name} size={64} />
        <label className="cursor-pointer rounded-lg border border-dark-border px-4 py-2 text-sm text-gray-200 hover:border-gold hover:text-gold transition-all">
          {uploading === "avatar" ? "Uploading..." : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "avatar")}
            disabled={uploading !== null}
            className="hidden"
          />
        </label>
      </div>

      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <input type="hidden" name="cover_url" value={coverUrl} />
      <input type="hidden" name="cover_position" value={coverPos} />

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
        <input name="full_name" defaultValue={profile.full_name ?? ""} className={field} />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Username</label>
        <input name="username" defaultValue={profile.username ?? ""} className={field} placeholder="janefounder" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Headline</label>
        <input name="headline" defaultValue={profile.headline ?? ""} className={field} placeholder="Founder, Acme Co. · Building in public" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Industry</label>
        <input name="industry" defaultValue={profile.industry ?? ""} className={field} placeholder="e.g. Real estate, Food & beverage" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Location</label>
        <input name="location" defaultValue={profile.location ?? ""} className={field} placeholder="Milwaukee, Wisconsin" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Bio</label>
        <textarea name="bio" defaultValue={profile.bio ?? ""} rows={3} className={`${field} resize-none`} placeholder="What do you build?" />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || uploading !== null}
          className="gold-bg-gradient text-black font-bold rounded-lg px-6 py-2.5 hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
