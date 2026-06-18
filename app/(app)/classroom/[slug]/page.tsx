import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ensureEnrollment } from "@/lib/classroom";

export const metadata = { title: "Course | BES" };

type Lesson = {
  id: string;
  title: string;
  slug: string;
  drip_days: number;
  is_published: boolean;
  sort_order: number;
};
type ModuleRow = { id: string; title: string; sort_order: number; lessons: Lesson[] };

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, subtitle, description, cover_url")
    .eq("slug", slug)
    .single();
  if (!course) notFound();

  await ensureEnrollment(course.id);

  const [{ data: enrollment }, { data: modules }, { data: progress }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("enrolled_at")
        .eq("user_id", profile?.id ?? "")
        .eq("course_id", course.id)
        .maybeSingle(),
      supabase
        .from("modules")
        .select("id, title, sort_order, lessons ( id, title, slug, drip_days, is_published, sort_order )")
        .eq("course_id", course.id)
        .order("sort_order"),
      supabase.from("lesson_progress").select("lesson_id").eq("user_id", profile?.id ?? ""),
    ]);

  const doneSet = new Set((progress ?? []).map((p) => p.lesson_id));
  const enrolledMs = enrollment?.enrolled_at
    ? new Date(enrollment.enrolled_at).getTime()
    : Date.now();
  const daysSince = (Date.now() - enrolledMs) / 86_400_000;

  const mods = ((modules ?? []) as unknown as ModuleRow[]).map((m) => ({
    ...m,
    lessons: [...(m.lessons ?? [])]
      .filter((l) => isAdmin || l.is_published)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  const allLessons = mods.flatMap((m) => m.lessons);
  const completed = allLessons.filter((l) => doneSet.has(l.id)).length;
  const pct = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;

  return (
    <div>
      <Link href="/classroom" className="text-sm text-gray-500 hover:text-gold">
        ← Classroom
      </Link>

      {course.cover_url && (
        <div
          className="aspect-[21/9] w-full rounded-xl bg-cover bg-center mt-2 border border-dark-border"
          style={{ backgroundImage: `url(${course.cover_url})` }}
        />
      )}

      <div className="flex items-start justify-between gap-4 mt-4 mb-6">
        <div>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {course.title}
          </h1>
          {course.subtitle && <p className="text-gold font-medium">{course.subtitle}</p>}
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">{course.description}</p>
        </div>
        {isAdmin && (
          <Link
            href={`/admin/courses/${slug}`}
            className="flex-shrink-0 text-sm rounded-lg border border-dark-border px-3 py-1.5 text-gray-300 hover:border-gold hover:text-gold"
          >
            Manage
          </Link>
        )}
      </div>

      {allLessons.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-gray-400">Your progress</span>
            <span className="text-gold font-semibold">
              {completed}/{allLessons.length} · {pct}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-dark-card overflow-hidden">
            <div className="h-full gold-bg-gradient" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {mods.length === 0 || allLessons.length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">
            Lessons for this course are coming soon.
            {isAdmin && (
              <>
                {" "}
                <Link href={`/admin/courses/${slug}`} className="text-gold hover:underline">
                  Add them now →
                </Link>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {mods.map((m) => (
            <div key={m.id}>
              <h2 className="font-bold text-white mb-2">{m.title}</h2>
              <div className="rounded-xl bg-dark-card border border-dark-border divide-y divide-dark-border">
                {m.lessons.map((l) => {
                  const locked = !isAdmin && l.drip_days > daysSince;
                  const done = doneSet.has(l.id);
                  const inner = (
                    <div className="flex items-center gap-3 p-4">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                          done
                            ? "gold-bg-gradient text-black"
                            : "border border-dark-border text-gray-600"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className={`flex-1 ${locked ? "text-gray-600" : "text-gray-200"}`}>
                        {l.title}
                        {!l.is_published && isAdmin && (
                          <span className="ml-2 text-xs text-gray-500">(draft)</span>
                        )}
                      </span>
                      {locked ? (
                        <span className="text-xs text-gray-600">
                          🔒 unlocks day {l.drip_days}
                        </span>
                      ) : (
                        <span className="text-gold text-sm">→</span>
                      )}
                    </div>
                  );
                  return locked ? (
                    <div key={l.id}>{inner}</div>
                  ) : (
                    <Link key={l.id} href={`/classroom/${slug}/${l.slug}`} className="block hover:bg-dark/40">
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
