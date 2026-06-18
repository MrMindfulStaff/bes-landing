import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { ensureEnrollment } from "@/lib/classroom";
import CourseTemplates from "@/components/classroom/CourseTemplates";
import CourseTips from "@/components/classroom/CourseTips";

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

const TABS = [
  { key: "lessons", label: "Lessons" },
  { key: "templates", label: "Templates" },
  { key: "tips", label: "Tips & Tricks" },
] as const;

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const active = TABS.some((t) => t.key === tab) ? tab! : "lessons";

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

      <div className="flex items-start justify-between gap-4 mt-4 mb-4">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Playfair Display', serif" }}>
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-dark-border mb-6">
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <Link
              key={t.key}
              href={`/classroom/${slug}?tab=${t.key}`}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                on
                  ? "border-gold text-gold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {active === "lessons" && (
        <Lessons courseId={course.id} slug={slug} profileId={profile?.id ?? ""} isAdmin={isAdmin} />
      )}
      {active === "templates" && (
        <CourseTemplates courseId={course.id} courseSlug={slug} isAdmin={isAdmin} />
      )}
      {active === "tips" && (
        <CourseTips courseId={course.id} courseName={course.title} courseSlug={slug} />
      )}
    </div>
  );
}

async function Lessons({
  courseId,
  slug,
  profileId,
  isAdmin,
}: {
  courseId: string;
  slug: string;
  profileId: string;
  isAdmin: boolean;
}) {
  const supabase = await createClient();
  const [{ data: enrollment }, { data: modules }, { data: progress }] = await Promise.all([
    supabase.from("enrollments").select("enrolled_at").eq("user_id", profileId).eq("course_id", courseId).maybeSingle(),
    supabase
      .from("modules")
      .select("id, title, sort_order, lessons ( id, title, slug, drip_days, is_published, sort_order )")
      .eq("course_id", courseId)
      .order("sort_order"),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", profileId),
  ]);

  const doneSet = new Set((progress ?? []).map((p) => p.lesson_id));
  const enrolledMs = enrollment?.enrolled_at ? new Date(enrollment.enrolled_at).getTime() : Date.now();
  const daysSince = (Date.now() - enrolledMs) / 86_400_000;

  const mods = ((modules ?? []) as unknown as ModuleRow[]).map((m) => ({
    ...m,
    lessons: [...(m.lessons ?? [])].filter((l) => isAdmin || l.is_published).sort((a, b) => a.sort_order - b.sort_order),
  }));
  const allLessons = mods.flatMap((m) => m.lessons);
  const completed = allLessons.filter((l) => doneSet.has(l.id)).length;
  const pct = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;

  if (mods.length === 0 || allLessons.length === 0) {
    return (
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
    );
  }

  return (
    <>
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
                        done ? "gold-bg-gradient text-black" : "border border-dark-border text-gray-600"
                      }`}
                    >
                      {done ? "✓" : ""}
                    </span>
                    <span className={`flex-1 ${locked ? "text-gray-600" : "text-gray-200"}`}>
                      {l.title}
                      {!l.is_published && isAdmin && <span className="ml-2 text-xs text-gray-500">(draft)</span>}
                    </span>
                    {locked ? (
                      <span className="text-xs text-gray-600">🔒 unlocks day {l.drip_days}</span>
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
    </>
  );
}
