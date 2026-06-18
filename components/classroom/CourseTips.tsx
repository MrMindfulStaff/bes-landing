import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import PostComposer from "@/components/feed/PostComposer";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import RealtimeRefresher from "@/components/feed/RealtimeRefresher";

const POST_SELECT = `id, title, body, created_at, like_count, comment_count, is_pinned,
  author:profiles!posts_author_id_fkey ( full_name, avatar_url, username, is_persona ),
  category:categories ( name, icon ),
  comments ( id, body, created_at, author:profiles!comments_author_id_fkey ( full_name, avatar_url ) )`;

export default async function CourseTips({
  courseId,
  courseName,
  courseSlug,
}: {
  courseId: string;
  courseName: string;
  courseSlug: string;
}) {
  const supabase = await createClient();
  const profile = await getProfile();

  const [{ data: posts }, { data: myLikes }] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("course_id", courseId)
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
      <p className="text-gray-500 text-sm mb-4">
        Swap tips, shortcuts, and hard-won lessons for this course with other members.
      </p>
      <PostComposer
        profile={profile}
        fixedCourse={{ id: courseId, name: courseName, slug: courseSlug }}
      />
      {feed.length === 0 ? (
        <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
          <p className="text-gray-400">No tips yet. Share the first one. 💡</p>
        </div>
      ) : (
        feed.map((post) => (
          <PostCard key={post.id} post={post} likedByMe={likedSet.has(post.id)} me={profile} />
        ))
      )}
    </div>
  );
}
