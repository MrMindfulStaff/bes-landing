import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CreateCourseForm from "@/components/admin/CreateCourseForm";

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
      <p className="text-gray-500 text-sm mb-6">
        Author classroom content, run events, and tune the XP structure.
      </p>

      <Link
        href="/admin/broadcast"
        className="flex items-center justify-between rounded-xl bg-dark-card border border-dark-border p-4 mb-3 hover:border-gold"
      >
        <span className="text-gray-200">📣 Broadcast — announce to the feed + notify &amp; email all members</span>
        <span className="text-sm text-gold">Compose →</span>
      </Link>

      <Link
        href="/admin/xp"
        className="flex items-center justify-between rounded-xl bg-dark-card border border-dark-border p-4 mb-6 hover:border-gold"
      >
        <span className="text-gray-200">⚡ XP &amp; Levels — edit the Founder Ascension ladder</span>
        <span className="text-sm text-gold">Edit →</span>
      </Link>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white">Classrooms</h2>
        <CreateCourseForm />
      </div>
      <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
        {(courses ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/courses/${c.slug}`}
            className="flex items-center justify-between p-4 hover:bg-dark/40"
          >
            <span className="text-gray-200">
              {c.title}
              {!c.is_published && (
                <span className="ml-2 text-xs text-gray-500 border border-dark-border rounded-full px-2 py-0.5">
                  draft
                </span>
              )}
            </span>
            <span className="text-sm text-gold">Manage →</span>
          </Link>
        ))}
        {(courses ?? []).length === 0 && (
          <p className="p-4 text-sm text-gray-500">No classrooms yet — create your first above.</p>
        )}
      </div>
    </div>
  );
}
