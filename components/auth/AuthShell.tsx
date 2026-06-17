import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <img
          src="/images/bes-logo.webp"
          alt="BES"
          className="w-12 h-12 rounded-full object-contain"
        />
        <span className="font-bold text-lg">The Black Entrepreneurship Society</span>
      </Link>

      <div className="w-full max-w-md text-center mb-8">
        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h1>
        <p className="text-gray-400">{subtitle}</p>
      </div>

      {isSupabaseConfigured ? (
        children
      ) : (
        <div className="w-full max-w-md rounded-xl bg-dark-card border border-dark-border p-6 text-center">
          <p className="text-gray-300">
            🔧 Member accounts are coming online shortly. Check back soon.
          </p>
        </div>
      )}
    </main>
  );
}
