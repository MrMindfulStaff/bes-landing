import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Classroom | BES" };

export default async function ClassroomPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, subtitle, description, cover_url, sort_order")
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
        12 courses, zero guesswork — from formation to exit.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(courses ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/classroom/${c.slug}`}
            className="card-hover block rounded-xl bg-dark-card border border-dark-border overflow-hidden"
          >
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={
                c.cover_url
                  ? { backgroundImage: `url(${c.cover_url})` }
                  : { background: "linear-gradient(135deg, #a88a3a, #0d0d0d)" }
              }
            />
            <div className="p-4">
              <h3 className="font-bold text-white leading-tight">{c.title}</h3>
              {c.subtitle && (
                <p className="text-gold text-xs font-medium mt-0.5">{c.subtitle}</p>
              )}
              <p className="text-gray-400 text-sm mt-2 leading-relaxed line-clamp-2">
                {c.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
