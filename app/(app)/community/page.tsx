import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import AddThreadTile from "@/components/community/AddThreadTile";

export const metadata = { title: "Community | BES" };

type ThreadRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  cover_url: string | null;
  posts: { count: number }[];
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon, color, cover_url, posts(count)")
    .order("sort_order");
  const threads = (data ?? []) as unknown as ThreadRow[];

  return (
    <div>
      <h1
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Community
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Pick a thread and jump in. Each one is its own conversation.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {threads.map((t) => {
          const count = t.posts?.[0]?.count ?? 0;
          return (
            <Link
              key={t.id}
              href={`/community/${t.slug}`}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-dark-border card-hover"
            >
              {t.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.cover_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${t.color || "#c9a84c"} 0%, #0d0d0d 95%)`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-2xl mb-1">{t.icon}</div>
                <h3 className="font-bold text-white leading-tight group-hover:text-gold transition-colors">
                  {t.name}
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  {count} {count === 1 ? "post" : "posts"}
                </p>
              </div>
            </Link>
          );
        })}

        {isAdmin && <AddThreadTile />}
      </div>
    </div>
  );
}
