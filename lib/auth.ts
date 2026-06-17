import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";

/** Returns the auth user or null. Null when the backend isn't wired yet. */
export async function getUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Full profile joined with membership, or null if signed out. */
export async function getProfile() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, memberships(*)")
    .eq("id", user.id)
    .single();
  return data;
}

/** Redirects to /login if signed out. Use at the top of protected pages. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Member access. No paywall yet — any signed-in user is a member.
 * When the paywall ships, gate on memberships.status here.
 */
export async function requireMember() {
  await requireUser();
  return getProfile();
}

/** Admin-only pages. Sends non-admins back to the community. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/community");
  return profile;
}
