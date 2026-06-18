import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import CompleteButton from "@/components/classroom/CompleteButton";

export const metadata = { title: "Lesson | BES" };

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson: lessonSlug } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const { data: course } = await supabase
    .from("courses")
    .select("id, title")
    .eq("slug", slug)
    .single();
  if (!course) notFound();

  const { data: mods } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id);
  const moduleIds = (mods ?? []).map((m) => m.id);

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, content, video_url, is_published")
    .eq("slug", lessonSlug)
    .in("module_id", moduleIds.length ? moduleIds : ["00000000-0000-0000-0000-000000000000"])
    .maybeSingle();
  if (!lesson || (!lesson.is_published && !isAdmin)) notFound();

  const { data: done } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", profile?.id ?? "")
    .eq("lesson_id", lesson.id)
    .maybeSingle();
  const completed = Boolean(done);

  const embed = lesson.video_url ? embedUrl(lesson.video_url) : null;

  return (
    <article className="max-w-3xl">
      <Link href={`/classroom/${slug}`} className="text-sm text-gray-500 hover:text-gold">
        ← {course.title}
      </Link>

      <h1
        className="text-2xl font-black mt-2 mb-6"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {lesson.title}
      </h1>

      {lesson.video_url && (
        <div className="mb-6">
          {embed ? (
            <div className="relative w-full rounded-xl overflow-hidden border border-dark-border" style={{ aspectRatio: "16/9" }}>
              <iframe
                src={embed}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              href={lesson.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-gold hover:underline"
            >
              ▶ Watch video
            </a>
          )}
        </div>
      )}

      {lesson.content && (
        <div
          className="lesson-content text-gray-200 leading-relaxed mb-8"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}

      <div className="border-t border-dark-border pt-6">
        <CompleteButton lessonId={lesson.id} courseSlug={slug} completed={completed} />
      </div>
    </article>
  );
}
