-- ============================================================================
-- 0008 — Attach generated cover images to the seeded threads
-- Images live at public/threads/<slug>.png (served by Vercel at /threads/...).
-- ============================================================================
update categories
   set cover_url = '/threads/' || slug || '.png'
 where cover_url is null;
