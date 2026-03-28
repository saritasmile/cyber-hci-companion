-- ============================================================
-- 003_rabbit_bookmarks_surprising.sql
-- Extend rabbit_bookmarks type to include 'surprising'
-- ============================================================

alter table public.rabbit_bookmarks
  drop constraint rabbit_bookmarks_type_check;

alter table public.rabbit_bookmarks
  add constraint rabbit_bookmarks_type_check
  check (type in ('topic', 'related', 'surprising'));
