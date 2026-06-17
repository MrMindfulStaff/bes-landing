import Link from "next/link";
import { getProfile } from "@/lib/auth";
import ProfileForm from "@/components/profile/ProfileForm";

export const metadata = { title: "Edit profile | BES" };

export default async function EditProfilePage() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <div>
      <Link href="/profile" className="text-sm text-gray-500 hover:text-gold">
        ← Back to profile
      </Link>
      <h1
        className="text-2xl font-black mt-2 mb-6"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Edit profile
      </h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
