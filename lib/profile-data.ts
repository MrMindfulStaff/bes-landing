import { createClient } from "@/lib/supabase/server";
import type { FeedPost } from "@/components/feed/PostCard";

const POST_SELECT = `id, title, body, created_at, like_count, comment_count, is_pinned,
  author:profiles!posts_author_id_fkey ( full_name, avatar_url, username ),
  category:categories ( name, icon ),
  comments ( id, body, created_at, author:profiles!comments_author_id_fkey ( full_name, avatar_url ) )`;

/** Everything the profile view needs for one member. */
export async function getProfileData(targetId: string, viewerId: string | null) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetId)
    .single();
  if (!profile) return null;

  const [followersRes, followingRes, postsRes, followRes, likesRes] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
    supabase.from("posts").select(POST_SELECT).eq("author_id", targetId).order("created_at", { ascending: false }).limit(30),
    viewerId
      ? supabase.from("follows").select("follower_id").eq("follower_id", viewerId).eq("following_id", targetId).maybeSingle()
      : Promise.resolve({ data: null }),
    viewerId
      ? supabase.from("likes").select("post_id").eq("user_id", viewerId)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const posts = ((postsRes.data ?? []) as unknown as FeedPost[]).map((p) => ({
    ...p,
    comments: [...(p.comments ?? [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }));

  return {
    profile,
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
    isFollowing: Boolean(followRes.data),
    posts,
    likedSet: new Set(((likesRes.data ?? []) as { post_id: string }[]).map((l) => l.post_id)),
  };
}
