import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import PostComposer from "@/components/feed/PostComposer";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import RealtimeRefresher from "@/components/feed/RealtimeRefresher";

export const metadata = { title: "Community | BES" };

export default async function CommunityPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const [{ data: categories }, { data: posts }, { data: myLikes }] = await Promise.all([
    supabase.from("categories").select("id, name, icon").order("sort_order"),
    supabase
      .from("posts")
      .select(
        `id, title, body, created_at, like_count, comment_count, is_pinned,
         author:profiles!posts_author_id_fkey ( full_name, avatar_url, username ),
         category:categories ( name, icon ),
         comments ( id, body, created_at, author:profiles!comments_author_id_fkey ( full_name, avatar_url ) )`
      )
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("likes").select("post_id").eq("user_id", profile?.id ?? ""),
  ]);

  const likedSet = new Set((myLikes ?? []).map((l) => l.post_id));
  const feed = (posts ?? []).map((p) => ({
    ...p,
    comments: [...(p.comments ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  })) as unknown as FeedPost[];

  return (
    <div>
      <RealtimeRefresher />
      <h1
        className="text-2xl font-black mb-1"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Community
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Real conversations with founders walking the same path.
      </p>

      <PostComposer categories={categories ?? []} profile={profile} />

      {feed.length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">
            No posts yet. Be the first to share something. 🌱
          </p>
        </div>
      ) : (
        feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            likedByMe={likedSet.has(post.id)}
            me={profile}
          />
        ))
      )}
    </div>
  );
}
