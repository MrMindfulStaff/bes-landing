"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => {
        router.push("/community");
        router.refresh();
      }, 1200);
    }
  }

  if (done) {
    return (
      <p className="text-green-accent text-center">
        ✓ Password updated. Taking you in...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">New password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-gold focus:outline-none"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full gold-bg-gradient text-black font-bold rounded-lg py-3 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "..." : "Set new password"}
      </button>
    </form>
  );
}
