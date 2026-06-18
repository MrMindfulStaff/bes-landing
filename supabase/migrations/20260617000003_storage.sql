-- ============================================================================
-- 0003 — Storage buckets + policies
-- Buckets for member avatars, feed media, and course media.
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('avatars',      'avatars',      true),
  ('post-media',   'post-media',   true),
  ('course-media', 'course-media', true)
on conflict (id) do nothing;

-- Public read for all three buckets (they hold public-facing media).
create policy "public read media" on storage.objects for select
  using (bucket_id in ('avatars', 'post-media', 'course-media'));

-- Avatars: a member may upload into their own folder (avatars/<uid>/...).
create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner = auth.uid());

-- Feed media: any authenticated member may upload.
create policy "upload post media" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media');

-- Course media: admins only.
create policy "upload course media" on storage.objects for insert to authenticated
  with check (bucket_id = 'course-media' and public.is_admin(auth.uid()));
