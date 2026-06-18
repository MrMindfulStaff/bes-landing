"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/community", label: "Community", icon: "💬" },
  { href: "/classroom", label: "Classroom", icon: "🎓" },
  { href: "/events", label: "Events", icon: "📅" },
  { href: "/members", label: "Members", icon: "🏆" },
  { href: "/messages", label: "Messages", icon: "✉️" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex md:flex-col gap-1">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-dark-card text-gold border border-dark-border"
                : "text-gray-400 hover:text-white hover:bg-dark-card/50"
            }`}
          >
            <span className="text-base">{l.icon}</span>
            <span className="hidden md:inline">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
