import { getProfile } from "@/lib/auth";
import ProfileForm from "@/components/profile/ProfileForm";
import Avatar from "@/components/app/Avatar";

export const metadata = { title: "Profile | BES" };

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Avatar url={profile.avatar_url} name={profile.full_name} size={64} />
        <div>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {profile.full_name || "Your profile"}
          </h1>
          <p className="text-sm text-gray-500">
            <span className="text-gold font-bold">{profile.points}</span> pts · Level{" "}
            {profile.level}
            {profile.industry ? ` · ${profile.industry}` : ""}
          </p>
        </div>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
