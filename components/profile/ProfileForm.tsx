"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions";

type Profile = {
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

  function onSubmit(formData: FormData) {
    setMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res?.error) setError(res.error);
      else setMsg("Saved.");
    });
  }

  const field = "w-full rounded-lg bg-dark border border-dark-border px-4 py-2.5 text-white focus:border-gold focus:outline-none";

  return (
    <form action={onSubmit} className="space-y-4 max-w-xl">
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
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Avatar URL</label>
        <input name="avatar_url" defaultValue={profile.avatar_url ?? ""} className={field} placeholder="https://..." />
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
