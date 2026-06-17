"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md rounded-xl bg-dark-card border border-dark-border p-6 text-center">
        <p className="text-gray-200">
          📧 If an account exists for <span className="text-gold">{email}</span>, a
          reset link is on its way. Check your inbox.
        </p>
        <Link href="/login" className="text-gold hover:underline text-sm mt-4 inline-block">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-gold focus:outline-none"
          placeholder="you@example.com"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full gold-bg-gradient text-black font-bold rounded-lg py-3 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "..." : "Send reset link"}
      </button>
      <p className="text-center text-sm text-gray-400">
        <Link href="/login" className="text-gold hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
