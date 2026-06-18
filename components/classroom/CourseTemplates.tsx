import { createClient } from "@/lib/supabase/server";
import AddTemplate from "@/components/classroom/AddTemplate";
import TemplateDeleteButton from "@/components/classroom/TemplateDeleteButton";

export default async function CourseTemplates({
  courseId,
  courseSlug,
  isAdmin,
}: {
  courseId: string;
  courseSlug: string;
  isAdmin: boolean;
}) {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("id, title, description, file_url, file_name, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  const items = templates ?? [];

  return (
    <div>
      {isAdmin && <AddTemplate courseId={courseId} courseSlug={courseSlug} />}

      {items.length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">
            No templates here yet.
            {isAdmin && " Add ready-to-use documents members can download."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 rounded-xl bg-dark-card border border-dark-border p-4"
            >
              <div className="w-10 h-10 rounded-lg bg-dark flex items-center justify-center text-xl flex-shrink-0">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{t.title}</p>
                {t.description && (
                  <p className="text-sm text-gray-500 truncate">{t.description}</p>
                )}
              </div>
              <a
                href={t.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={t.file_name ?? true}
                className="flex-shrink-0 text-sm rounded-lg gold-bg-gradient text-black font-bold px-4 py-1.5 hover:opacity-90"
              >
                Download
              </a>
              {isAdmin && <TemplateDeleteButton id={t.id} courseSlug={courseSlug} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
