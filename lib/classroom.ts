"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function userOrThrow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, user };
}

/** Auto-enroll a member in a (free) course the first time they open it. */
export async function ensureEnrollment(courseId: string) {
  const { supabase, user } = await userOrThrow();
  await supabase
    .from("enrollments")
    .upsert(
      { user_id: user.id, course_id: courseId, source: "membership" },
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );
}

/** Toggle a lesson's completion for the current user. */
export async function toggleLessonComplete(
  lessonId: string,
  courseSlug: string,
  completed: boolean
) {
  const { supabase, user } = await userOrThrow();
  if (completed) {
    await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
  } else {
    await supabase
      .from("lesson_progress")
      .insert({ user_id: user.id, lesson_id: lessonId });
  }
  revalidatePath(`/classroom/${courseSlug}`);
  return { ok: true };
}

// ── Admin authoring (RLS enforces is_admin) ─────────────────────────────────

export async function createCourse(formData: FormData) {
  const { supabase } = await userOrThrow();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Classroom needs a title." };

  const { error } = await supabase.from("courses").insert({
    title,
    slug: slugify(title),
    subtitle: String(formData.get("subtitle") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    cover_url: String(formData.get("cover_url") || "").trim() || null,
    is_published: formData.get("is_published") === "on",
    sort_order: Number(formData.get("sort_order") || 100),
  });
  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "A classroom with that name already exists."
        : error.message,
    };
  }
  revalidatePath("/admin");
  revalidatePath("/classroom");
  return { ok: true, slug: slugify(title) };
}

export async function createModule(formData: FormData) {
  const { supabase } = await userOrThrow();
  const courseId = String(formData.get("course_id") || "");
  const courseSlug = String(formData.get("course_slug") || "");
  const title = String(formData.get("title") || "").trim();
  const sort = Number(formData.get("sort_order") || 0);
  if (!title) return { error: "Module needs a title." };

  const { error } = await supabase
    .from("modules")
    .insert({ course_id: courseId, title, sort_order: sort });
  if (error) return { error: error.message };
  revalidatePath(`/admin/courses/${courseSlug}`);
  revalidatePath(`/classroom/${courseSlug}`);
  return { ok: true };
}

export async function createLesson(formData: FormData) {
  const { supabase } = await userOrThrow();
  const moduleId = String(formData.get("module_id") || "");
  const courseSlug = String(formData.get("course_slug") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Lesson needs a title." };

  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title,
    slug: slugify(title),
    content: String(formData.get("content") || "") || null,
    video_url: String(formData.get("video_url") || "") || null,
    drip_days: Number(formData.get("drip_days") || 0),
    sort_order: Number(formData.get("sort_order") || 0),
    is_published: formData.get("is_published") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/courses/${courseSlug}`);
  revalidatePath(`/classroom/${courseSlug}`);
  return { ok: true };
}

export async function updateLesson(formData: FormData) {
  const { supabase } = await userOrThrow();
  const id = String(formData.get("id") || "");
  const courseSlug = String(formData.get("course_slug") || "");
  const title = String(formData.get("title") || "").trim();

  const { error } = await supabase
    .from("lessons")
    .update({
      title,
      content: String(formData.get("content") || "") || null,
      video_url: String(formData.get("video_url") || "") || null,
      drip_days: Number(formData.get("drip_days") || 0),
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/courses/${courseSlug}`);
  revalidatePath(`/classroom/${courseSlug}`);
  return { ok: true };
}

export async function deleteLesson(lessonId: string, courseSlug: string) {
  const { supabase } = await userOrThrow();
  await supabase.from("lessons").delete().eq("id", lessonId);
  revalidatePath(`/admin/courses/${courseSlug}`);
  revalidatePath(`/classroom/${courseSlug}`);
}

export async function deleteModule(moduleId: string, courseSlug: string) {
  const { supabase } = await userOrThrow();
  await supabase.from("modules").delete().eq("id", moduleId);
  revalidatePath(`/admin/courses/${courseSlug}`);
  revalidatePath(`/classroom/${courseSlug}`);
}
