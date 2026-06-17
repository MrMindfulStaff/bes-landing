import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getProfileData } from "@/lib/profile-data";
import ProfileView from "@/components/profile/ProfileView";

export const metadata = { title: "Member | BES" };

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getProfile();
  const data = await getProfileData(id, me?.id ?? null);
  if (!data) notFound();

  return (
    <ProfileView
      profile={data.profile}
      isOwn={me?.id === id}
      isFollowing={data.isFollowing}
      followers={data.followers}
      following={data.following}
      posts={data.posts}
      likedSet={data.likedSet}
      me={me}
    />
  );
}
