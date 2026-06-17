import Link from "next/link";
import { requireUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/app/AppNav";
import MobileNav from "@/components/app/MobileNav";
import Avatar from "@/components/app/Avatar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getProfile();

  // Presence heartbeat — powers "Online now" on profiles.
  if (profile) {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", profile.id);
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-dark/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/community" className="flex items-center gap-2.5">
            <img
              src="/images/bes-logo.webp"
              alt="BES"
              className="w-9 h-9 rounded-full object-contain"
            />
            <span className="font-bold hidden sm:block">BES</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gold font-bold">{profile?.points ?? 0}</span>
              <span className="text-gray-500">pts · Lvl {profile?.level ?? 1}</span>
            </div>
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm text-gray-400 hover:text-gold transition-colors hidden sm:block"
              >
                Admin
              </Link>
            )}
            <Link href="/profile">
              <Avatar url={profile?.avatar_url} name={profile?.full_name} size={36} />
            </Link>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-gray-400 hover:text-gold transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <AppNav />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <MobileNav />
    </div>
  );
}
