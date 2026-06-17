"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/lib/actions";

export default function FollowButton({
  targetId,
  initialFollowing,
}: {
  targetId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() =>
        start(async () => {
          const next = !following;
          setFollowing(next);
          await toggleFollow(targetId, following);
        })
      }
      disabled={pending}
      className={`rounded-lg px-6 py-2 font-bold transition-all disabled:opacity-50 ${
        following
          ? "border border-dark-border text-gray-200 hover:border-gold hover:text-gold"
          : "gold-bg-gradient text-black hover:opacity-90"
      }`}
    >
      {following ? "Following" : "+ Follow"}
    </button>
  );
}
