import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import PostComposer from "@/components/feed/PostComposer";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import RealtimeRefresher from "@/components/feed/RealtimeRefresher";

export const metadata = { title: "Thread | BES" };

const POST_SELECT = `id, title, body, created_at, like_count, comment_count, is_pinned,
  author:profiles!posts_author_id_fkey ( full_name, avatar_url, username, is_persona ),
  category:categories ( name, icon ),
  comments ( id, body, created_at, author:profiles!comments_author_id_fkey ( full_name, avatar_url ) )`;

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const profile = await getProfile();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon, color")
    .eq("slug", slug)
    .single();
  if (!category) notFound();

  const [{ data: posts }, { data: myLikes }] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("category_id", category.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("likes").select("post_id").eq("user_id", profile?.id ?? ""),
  ]);

  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));
  const feed = ((posts ?? []) as unknown as FeedPost[]).map((p) => ({
    ...p,
    comments: [...(p.comments ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }));

  return (
    <div>
      <RealtimeRefresher />
      <Link href="/community" className="text-sm text-gray-500 hover:text-gold">
        ← All threads
      </Link>

      <h1
        className="text-2xl font-black mt-2 mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {category.name}
      </h1>
      {category.description && (
        <p className="text-gray-500 text-sm mb-6">{category.description}</p>
      )}

      <div className="mt-4">
        <PostComposer
          profile={profile}
          fixedCategory={{ id: category.id, name: category.name }}
        />
      </div>

      {feed.length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">
            No posts in {category.name} yet. Start the conversation. 🌱
          </p>
        </div>
      ) : (
        feed.map((post) => (
          <PostCard key={post.id} post={post} likedByMe={likedSet.has(post.id)} me={profile} />
        ))
      )}
    </div>
  );
}
