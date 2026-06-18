import Link from "next/link";
import Avatar from "@/components/app/Avatar";
import FollowButton from "@/components/profile/FollowButton";
import PostCard, { type FeedPost } from "@/components/feed/PostCard";
import { levelName, levelProgress } from "@/lib/levels";

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  cover_position: number | null;
  headline: string | null;
  bio: string | null;
  industry: string | null;
  location: string | null;
  points: number;
  level: number;
  streak_days: number | null;
  role: string;
  created_at: string;
  last_active_at: string | null;
};

function joinedLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function presence(lastActive: string | null) {
  if (!lastActive) return null;
  const mins = (Date.now() - new Date(lastActive).getTime()) / 60000;
  if (mins < 5) return { online: true, label: "Online now" };
  if (mins < 60) return { online: false, label: `Active ${Math.floor(mins)}m ago` };
  const h = Math.floor(mins / 60);
  if (h < 24) return { online: false, label: `Active ${h}h ago` };
  return { online: false, label: `Active ${Math.floor(h / 24)}d ago` };
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <span className="block font-bold text-white">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function IntroRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-300">
      <span className="w-5 text-center">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

export default function ProfileView({
  profile,
  isOwn,
  isFollowing,
  followers,
  following,
  posts,
  likedSet,
  me,
  badges,
  earnedBadges,
}: {
  profile: Profile;
  isOwn: boolean;
  isFollowing: boolean;
  followers: number;
  following: number;
  posts: FeedPost[];
  likedSet: Set<string>;
  me: { full_name: string | null; avatar_url: string | null } | null;
  badges: { slug: string; name: string; description: string; icon: string }[];
  earnedBadges: Set<string>;
}) {
  const status = presence(profile.last_active_at);
  const prog = levelProgress(profile.points);

  return (
    <div className="-mt-2">
      {/* Header card: cover + avatar */}
      <div className="rounded-xl overflow-hidden bg-dark-card border border-dark-border">
        <div
          className="h-40 sm:h-56 w-full bg-cover"
          style={
            profile.cover_url
              ? {
                  backgroundImage: `url(${profile.cover_url})`,
                  backgroundPosition: `center ${profile.cover_position ?? 50}%`,
                }
              : {
                  background:
                    "linear-gradient(120deg, #a88a3a 0%, #c9a84c 40%, #1a1a1a 100%)",
                }
          }
        />
        <div className="px-5 sm:px-6 pb-4">
          <div className="flex items-end gap-4 flex-wrap -mt-12 sm:-mt-14">
            <div className="rounded-full ring-4 ring-dark-card">
              <Avatar url={profile.avatar_url} name={profile.full_name} size={112} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1
                className="text-2xl font-black text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {profile.full_name || "Member"}
                {profile.role === "admin" && (
                  <span className="ml-2 align-middle text-xs text-gold bg-gold/10 rounded-full px-2 py-0.5">
                    Admin
                  </span>
                )}
              </h1>
              {profile.username && (
                <p className="text-sm text-gray-500">@{profile.username}</p>
              )}
              {profile.headline && (
                <p className="text-gray-300 mt-1">{profile.headline}</p>
              )}
            </div>
            <div className="pb-1">
              {isOwn ? (
                <Link
                  href="/profile/edit"
                  className="inline-block rounded-lg border border-dark-border px-5 py-2 font-semibold text-gray-200 hover:border-gold hover:text-gold transition-all"
                >
                  Edit profile
                </Link>
              ) : (
                <FollowButton targetId={profile.id} initialFollowing={isFollowing} />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-4 pt-4 border-t border-dark-border">
            <Stat value={posts.length} label="Posts" />
            <Stat value={followers} label="Followers" />
            <Stat value={following} label="Following" />
            <div className="text-center">
              <span className="block font-bold text-gold">{profile.points}</span>
              <span className="text-xs text-gray-500">XP · {levelName(profile.level)}</span>
            </div>
          </div>

          {/* Level progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gold font-semibold">
                Lvl {prog.level} · {prog.name}
              </span>
              <span className="text-gray-500">
                {prog.max ? "Max level — Legacy 🏆" : `${prog.toNext} XP to ${prog.nextName}`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-dark overflow-hidden">
              <div className="h-full gold-bg-gradient" style={{ width: `${prog.pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Body: Intro + Posts */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <aside className="md:col-span-1 space-y-4">
          <div className="rounded-xl bg-dark-card border border-dark-border p-5">
            <h2 className="font-bold text-white mb-3">Intro</h2>
            {profile.bio && (
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">{profile.bio}</p>
            )}
            <div className="space-y-2.5">
              {profile.industry && <IntroRow icon="💼">{profile.industry}</IntroRow>}
              {profile.location && <IntroRow icon="📍">{profile.location}</IntroRow>}
              <IntroRow icon="📅">Joined {joinedLabel(profile.created_at)}</IntroRow>
              <IntroRow icon="⭐">
                {levelName(profile.level)} · {profile.points} XP
              </IntroRow>
              {(profile.streak_days ?? 0) > 0 && (
                <IntroRow icon="🔥">{profile.streak_days}-day streak</IntroRow>
              )}
              {status && (
                <IntroRow icon={status.online ? "🟢" : "⚪"}>{status.label}</IntroRow>
              )}
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="rounded-xl bg-dark-card border border-dark-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-white">Badges</h2>
                <span className="text-xs text-gray-500">
                  {badges.filter((b) => earnedBadges.has(b.slug)).length}/{badges.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {badges.map((b) => {
                  const earned = earnedBadges.has(b.slug);
                  return (
                    <div
                      key={b.slug}
                      title={`${b.name} — ${b.description}${earned ? "" : "  (locked)"}`}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${
                          earned
                            ? "bg-gold/15 ring-1 ring-gold"
                            : "bg-dark border border-dark-border opacity-40 grayscale"
                        }`}
                      >
                        {b.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        <div className="md:col-span-2">
          <h2 className="font-bold text-white mb-3">Posts</h2>
          {posts.length === 0 ? (
            <div className="rounded-xl bg-dark-card border border-dark-border p-10 text-center">
              <p className="text-gray-400">
                {isOwn ? "You haven't" : `${profile.full_name || "This member"} hasn't`}{" "}
                posted yet.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                likedByMe={likedSet.has(post.id)}
                me={me}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
