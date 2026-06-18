-- ============================================================================
-- 0006 — Cover photo focal point (drag-to-reposition)
-- Stores the vertical background-position (0–100%) for the profile banner.
-- ============================================================================
alter table profiles add column if not exists cover_position int not null default 50;
