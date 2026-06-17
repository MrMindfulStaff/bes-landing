-- ============================================================================
-- BES Platform — seed data
-- Feed categories + the 12 flagship courses (ported from the landing page).
-- Idempotent: safe to re-run.
-- ============================================================================

-- ── Feed categories ─────────────────────────────────────────────────────────
insert into categories (name, slug, description, icon, sort_order) values
  ('Introductions',     'introductions',  'New here? Tell us who you are and what you build.', '👋', 1),
  ('Wins',              'wins',           'Celebrate progress — closed deals, launches, milestones.', '🏆', 2),
  ('Ask the Community', 'ask',            'Stuck on something? Ask the founders walking the same path.', '💬', 3),
  ('Resources',        'resources',       'Templates, checklists, and frameworks you can deploy now.', '📄', 4),
  ('Flowers on Friday', 'flowers',        'Every week we spotlight Black excellence and member wins.', '🌻', 5),
  ('Partnerships',     'partnerships',    'Find co-founders, partners, and collaborators.', '🤝', 6)
on conflict (slug) do nothing;

-- ── Flagship curriculum (12 courses, free with membership) ───────────────────
insert into courses (title, slug, subtitle, description, is_paid, is_published, sort_order) values
  ('Documents & Legal Infrastructure','documents-legal','Building Your Business Foundation','Set your business up the right way from day one with essential legal documents, structures, and compliance frameworks.', false, true, 1),
  ('Marketing & Brand','marketing-brand','Creating a Business That Stands Out','Build a clear brand identity that attracts your ideal customers and sets you apart from the competition.', false, true, 2),
  ('Sales & Customer Acquisition','sales-acquisition','Turning Leads Into Revenue','Learn how to attract leads, build trust, and close deals that keep your revenue growing.', false, true, 3),
  ('Customer Service & Satisfaction','customer-service','Building Loyal Customers','Deliver exceptional customer experiences that turn first-time buyers into lifelong advocates.', false, true, 4),
  ('Financial Advantage','financial-advantage','Managing Money for Growth','Master bookkeeping, cash flow management, and financial planning to fuel sustainable growth.', false, true, 5),
  ('Access to Capital','access-capital','Funding Your Business the Smart Way','Break down how to secure funding — from grants and loans to investors and creative financing.', false, true, 6),
  ('Taxes & Tax Strategy','taxes-strategy','Keeping More of What You Earn','Smart tax planning that protects your profits and keeps you compliant with the basics of business taxation.', false, true, 7),
  ('Operations & Workflow','operations-workflow','Running Your Business Smoothly','Design workflows and systems that save time, reduce errors, and let you focus on growth.', false, true, 8),
  ('Mindset & Inner Game','mindset','Strengthening the Entrepreneur Within','Build resilience, confidence, and the mental toughness every founder needs to win long-term.', false, true, 9),
  ('Technology & System Selection','technology','Choosing Tools That Work','Select the right platforms and systems that make your business run smarter, not harder.', false, true, 10),
  ('Staffing & Team Building','staffing-team','Building the Right Crew','Hire right, manage well, and build a team that amplifies your vision and output.', false, true, 11),
  ('Exit & Legacy Planning','exit-legacy','Building What Lasts','Prepare for stepping away on your terms — selling, transitioning, or building generational wealth.', false, true, 12)
on conflict (slug) do nothing;
