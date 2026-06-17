"use client";

import { useRef, useState, useTransition } from "react";
import { toggleLike, addComment } from "@/lib/actions";
import Avatar from "@/components/app/Avatar";

type Person = { full_name: string | null; avatar_url: string | null; username?: string | null };
type Comment = { id: string; body: string; created_at: string; author: Person | null };
export type FeedPost = {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  author: Person | null;
  category: { name: string; icon: string | null } | null;
  comments: Comment[];
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function PostCard({
  post,
  likedByMe,
  me,
}: {
  post: FeedPost;
  likedByMe: boolean;
  me: Person | null;
}) {
  const [showComments, setShowComments] = useState(false);
  const [liking, startLike] = useTransition();
  const [commenting, startComment] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <article className="rounded-xl bg-dark-card border border-dark-border p-5 mb-4">
      {post.is_pinned && (
        <p className="text-xs text-gold font-semibold mb-2">📌 Pinned</p>
      )}
      <div className="flex items-start gap-3">
        <Avatar url={post.author?.avatar_url} name={post.author?.full_name} size={42} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white">
              {post.author?.full_name || "Member"}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
            {post.category && (
              <span className="text-xs text-gold bg-gold/10 rounded-full px-2 py-0.5">
                {post.category.icon} {post.category.name}
              </span>
            )}
          </div>

          {post.title && (
            <h3 className="font-bold text-lg text-white mt-2">{post.title}</h3>
          )}
          <p className="text-gray-200 mt-1 whitespace-pre-wrap break-words">
            {post.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-5 mt-4 text-sm">
            <button
              onClick={() => startLike(async () => { await toggleLike(post.id); })}
              disabled={liking}
              className={`flex items-center gap-1.5 transition-colors ${
                likedByMe ? "text-gold" : "text-gray-400 hover:text-gold"
              }`}
            >
              <span>{likedByMe ? "♥" : "♡"}</span>
              <span>{post.like_count}</span>
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <span>💬</span>
              <span>{post.comment_count}</span>
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-4 space-y-3 border-t border-dark-border pt-4">
              {post.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar url={c.author?.avatar_url} name={c.author?.full_name} size={28} />
                  <div className="flex-1 rounded-lg bg-dark px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {c.author?.full_name || "Member"}
                      </span>
                      <span className="text-xs text-gray-500">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5 whitespace-pre-wrap break-words">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}

              <form
                ref={formRef}
                action={(fd) =>
                  startComment(async () => {
                    await addComment(fd);
                    formRef.current?.reset();
                  })
                }
                className="flex items-start gap-2.5"
              >
                <Avatar url={me?.avatar_url} name={me?.full_name} size={28} />
                <input type="hidden" name="post_id" value={post.id} />
                <input
                  name="body"
                  required
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg bg-dark border border-dark-border px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={commenting}
                  className="text-sm text-gold font-semibold hover:underline disabled:opacity-50 py-2"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
