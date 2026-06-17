import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Classroom | BES" };

export default async function ClassroomPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, subtitle, description, sort_order")
    .eq("is_published", true)
    .order("sort_order");

  return (
    <div>
      <h1
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Classroom
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        12 courses, zero guesswork — from formation to exit. Lessons rolling out soon.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {(courses ?? []).map((c) => (
          <div
            key={c.id}
            className="card-hover rounded-xl bg-dark-card border border-dark-border p-5"
          >
            <h3 className="font-bold text-white">{c.title}</h3>
            {c.subtitle && <p className="text-gold text-sm font-medium mt-0.5">{c.subtitle}</p>}
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{c.description}</p>
            <p className="text-xs text-gray-600 mt-4">Lessons coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
