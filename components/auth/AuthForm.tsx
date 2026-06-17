"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/community";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next);
          router.refresh();
        } else {
          setInfo("Check your email to confirm your account, then log in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
              placeholder="Jane Founder"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-dark-card border border-dark-border px-4 py-3 text-white focus:border-gold focus:outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-green-accent">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full gold-bg-gradient text-black font-bold rounded-lg py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "..." : isSignup ? "Create my account" : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-dark-border" />
        <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-dark-border" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full rounded-lg border border-dark-border text-gray-200 font-semibold py-3 hover:border-gold hover:text-gold transition-all"
      >
        Continue with Google
      </button>

      <p className="text-center text-sm text-gray-400 mt-6">
        {isSignup ? "Already a member? " : "New to the Society? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-gold hover:underline font-semibold"
        >
          {isSignup ? "Log in" : "Join free"}
        </Link>
      </p>
    </div>
  );
}
