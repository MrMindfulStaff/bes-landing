"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPost(formData: FormData) {
  const body = String(formData.get("body") || "").trim();
  const categoryId = formData.get("category_id");
  const courseId = formData.get("course_id");
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
    course_id: courseId ? String(courseId) : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/community");
  const courseSlug = formData.get("course_slug");
  if (courseSlug) revalidatePath(`/classroom/${courseSlug}`);
  return { ok: true };
}

export async function createTemplate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = String(formData.get("title") || "").trim();
  const fileUrl = String(formData.get("file_url") || "").trim();
  if (!title || !fileUrl) return { error: "Title and a file are required." };

  const { error } = await supabase.from("templates").insert({
    course_id: String(formData.get("course_id")),
    title,
    description: String(formData.get("description") || "").trim() || null,
    file_url: fileUrl,
    file_name: String(formData.get("file_name") || "").trim() || null,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath(`/classroom/${formData.get("course_slug")}`);
  return { ok: true };
}

export async function deleteTemplate(id: string, courseSlug: string) {
  const supabase = await createClient();
  await supabase.from("templates").delete().eq("id", id);
  revalidatePath(`/classroom/${courseSlug}`);
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

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Thread name required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50) || `thread-${Date.now()}`;

  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    icon: String(formData.get("icon") || "").trim() || "💬",
    color: String(formData.get("color") || "").trim() || "#c9a84c",
    cover_url: String(formData.get("cover_url") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    sort_order: 100,
  });
  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "A thread with that name already exists."
        : error.message,
    };
  }
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
