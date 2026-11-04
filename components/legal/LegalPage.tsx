import Link from "next/link";
import type { ReactNode } from "react";

export const LEGAL_EFFECTIVE_DATE = "November 4, 2026";
export const LEGAL_CONTACT_EMAIL = "team@jointhebes.com";

type Section = {
  title: string;
  body: ReactNode;
};

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: Section[];
}) {
  return (
    <main className="min-h-screen bg-dark text-gray-200">
      <header className="border-b border-dark-border px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/bes-logo.webp"
              alt="BES Logo"
              className="w-8 h-8 rounded-full object-contain"
            />
            <span className="text-sm font-semibold text-white">
              The Black Entrepreneurship Society
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gold transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              Terms
            </Link>
            <Link href="/login" className="hover:text-gold transition-colors">
              Member Login
            </Link>
          </nav>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <h1
          className="text-4xl sm:text-5xl font-black text-white mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {title}
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Effective {LEGAL_EFFECTIVE_DATE}
        </p>

        <div className="text-gray-300 leading-relaxed space-y-4 mb-12">
          {intro}
        </div>

        <ol className="space-y-10">
          {sections.map((s, i) => (
            <li key={s.title}>
              <h2 className="text-xl font-bold text-white mb-3">
                <span className="text-gold mr-2">{i + 1}.</span>
                {s.title}
              </h2>
              <div className="text-gray-300 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-gold [&_a]:underline">
                {s.body}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-16 text-sm text-gray-500">
          Questions? Email{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-gold underline">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </article>

      <footer className="border-t border-dark-border px-6 py-10">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span>
            &copy; {new Date().getFullYear()} The Black Entrepreneurship Society.
            All rights reserved.
          </span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
