import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AddModuleForm from "@/components/admin/AddModuleForm";
import ModuleManager from "@/components/admin/ModuleManager";

export const metadata = { title: "Manage course | BES" };

type Lesson = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  drip_days: number;
  is_published: boolean;
  sort_order: number;
};
type ModuleRow = { id: string; title: string; sort_order: number; lessons: Lesson[] };

export default async function ManageCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", slug)
    .single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort_order, lessons ( id, title, content, video_url, drip_days, is_published, sort_order )")
    .eq("course_id", course.id)
    .order("sort_order");

  const mods = (modules ?? []) as unknown as ModuleRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gold">
          ← Admin
        </Link>
        <Link href={`/classroom/${slug}`} className="text-sm text-gray-400 hover:text-gold">
          View as member →
        </Link>
      </div>
      <h1
        className="text-2xl font-black mb-6"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {course.title}
      </h1>

      <AddModuleForm courseId={course.id} courseSlug={slug} nextOrder={mods.length} />

      {mods.map((m) => (
        <ModuleManager key={m.id} module={m} courseSlug={slug} />
      ))}

      {mods.length === 0 && (
        <p className="text-gray-500 text-sm">
          Add your first module above to start building this course.
        </p>
      )}
    </div>
  );
}
