-- ============================================================================
-- 0007 — Community threads as tiles
-- Adds a cover image per thread and reseeds with the BES thread set.
-- (Safe to reseed: no posts exist yet.)
-- ============================================================================
alter table categories add column if not exists cover_url text;

delete from categories;
insert into categories (name, slug, description, icon, color, sort_order) values
  ('Let''s Talk About It!',     'lets-talk',        'Open conversation — anything on your mind.',                  '💬', '#c9a84c', 1),
  ('Support or Help Needed',    'support',          'Stuck on something? Ask the founders walking the same path.', '🤝', '#2d8a4e', 2),
  ('Partnerships & Collaboration','partnerships',   'Find co-founders, partners, and collaborators.',             '🔗', '#3b82f6', 3),
  ('Share Real Impact!',        'impact',           'Celebrate wins, milestones, and real results.',              '🌟', '#eab308', 4),
  ('The Black Marketplace',     'marketplace',      'Buy, sell, and promote Black-owned products & services.',     '🛍️', '#a855f7', 5),
  ('Losses are Lessons!',       'losses-lessons',   'What didn''t work — and what you took away from it.',         '📉', '#ef4444', 6),
  ('Marketing & Growth Hacks',  'marketing-growth', 'Tactics to attract customers and grow revenue.',             '📈', '#06b6d4', 7),
  ('Flowers on Friday',         'flowers',          'Weekly spotlight celebrating Black excellence.',             '🌻', '#f59e0b', 8);
