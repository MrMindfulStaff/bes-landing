-- ============================================================================
-- 0009 — Attach generated cover images to the 12 flagship courses
-- Images live at public/courses/<slug>.png (served by Vercel at /courses/...).
-- ============================================================================
update courses
   set cover_url = '/courses/' || slug || '.png'
 where cover_url is null;
