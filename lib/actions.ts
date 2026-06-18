"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  const categoryId = formData.get("category_id");
  const title = String(formData.get("title") || "").trim() || null;
  if (!body) return { error: "Say something first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    body,
    title,
    category_id: categoryId ? String(categoryId) : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/community");
  return { ok: true };
}

export async function addComment(formData: FormData) {
  const postId = String(formData.get("post_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!postId || !body) return { error: "Empty comment." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, body });
  if (error) return { error: error.message };

  revalidatePath("/community");
  return { ok: true };
}

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
  }
  revalidatePath("/community");
  return { ok: true };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const payload = {
    full_name: String(formData.get("full_name") || "").trim() || null,
    username: String(formData.get("username") || "").trim() || null,
    headline: String(formData.get("headline") || "").trim() || null,
    bio: String(formData.get("bio") || "").trim() || null,
    industry: String(formData.get("industry") || "").trim() || null,
    location: String(formData.get("location") || "").trim() || null,
    avatar_url: String(formData.get("avatar_url") || "").trim() || null,
    cover_url: String(formData.get("cover_url") || "").trim() || null,
    cover_position: Math.max(0, Math.min(100, Math.round(Number(formData.get("cover_position")) || 50))),
    onboarding_completed: true,
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/community");
  return { ok: true };
}

export async function toggleFollow(targetId: string, isFollowing: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetId) return { error: "Cannot follow." };

  if (isFollowing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetId });
  }
  revalidatePath(`/members/${targetId}`);
  revalidatePath("/profile");
  return { ok: true };
}
