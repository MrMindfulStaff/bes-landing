import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin | BES" };

export default async function AdminPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, is_published")
    .order("sort_order");

  return (
    <div>
      <h1
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Admin
      </h1>
      <p className="text-gray-500 text-sm mb-6">Author classroom content.</p>

      <h2 className="font-bold text-white mb-3">Courses</h2>
      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
        {(courses ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/courses/${c.slug}`}
            className="flex items-center justify-between p-4 hover:bg-dark/40"
          >
            <span className="text-gray-200">{c.title}</span>
            <span className="text-sm text-gold">Manage →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
