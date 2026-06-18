-- ============================================================================
-- 0029 — Admin-editable XP ladder
-- The levels table was read-only to authenticated users (only service_role could
-- write). Give admins full write access so they can edit the XP structure from
-- the UI, plus an RPC to re-apply the ladder to every member after a change.
-- ============================================================================

create policy "levels admin" on levels for all to authenticated
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- Re-derive every member's level from the current ladder. Called after an admin
-- edits the thresholds so displayed levels stay consistent. Admin-only.
create or replace function recompute_levels()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin(auth.uid()) then
    raise exception 'admin only';
  end if;
  update profiles set level = level_for_xp(points);
end; $$;
grant execute on function recompute_levels() to authenticated;
