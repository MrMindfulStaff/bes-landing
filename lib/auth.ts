import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Returns the auth user or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Full profile joined with membership, or null if signed out. */
export async function getProfile() {
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

/** Redirects to checkout if the user has no active membership. */
export async function requireMember() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const status = profile.memberships?.[0]?.status ?? profile.memberships?.status;
  const active = status === "active" || status === "trialing" || profile.role === "admin";
  if (!active) redirect("/join");
  return profile;
}
