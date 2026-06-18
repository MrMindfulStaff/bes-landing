import { getProfile } from "@/lib/auth";
import { getProfileData } from "@/lib/profile-data";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = { title: "Profile | BES" };

export default async function ProfilePage() {
  const me = await getProfile();
  if (!me) return null;
  const data = await getProfileData(me.id, me.id);
  if (!data) return null;

  return (
    <ProfileView
      profile={data.profile}
      isOwn
      isFollowing={false}
      followers={data.followers}
      following={data.following}
      posts={data.posts}
      likedSet={data.likedSet}
      me={me}
      badges={data.badges}
      earnedBadges={data.earnedBadges}
    />
  );
}
