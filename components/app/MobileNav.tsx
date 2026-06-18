"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/community", label: "Community", icon: "💬" },
  { href: "/assistant", label: "BES AI", icon: "✨" },
  { href: "/classroom", label: "Classroom", icon: "🎓" },
  { href: "/events", label: "Events", icon: "📅" },
  { href: "/members", label: "Members", icon: "🏆" },
  { href: "/messages", label: "Chat", icon: "✉️" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-dark/95 backdrop-blur-md border-t border-dark-border">
      <div className="flex items-center justify-around">
        {LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 text-[10px] font-medium ${
                active ? "text-gold" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
