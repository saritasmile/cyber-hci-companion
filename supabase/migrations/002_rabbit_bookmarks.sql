-- ============================================================
-- 002_rabbit_bookmarks.sql
-- Rabbit Hole bookmarks — saved topics and related concepts
-- ============================================================

create table public.rabbit_bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  topic      text not null,
  type       text not null check (type in ('topic', 'related')),
  created_at timestamptz not null default now(),
  unique (user_id, topic, type)
);

create index rabbit_bookmarks_user_id_idx on public.rabbit_bookmarks (user_id);

alter table public.rabbit_bookmarks enable row level security;

create policy "rabbit_bookmarks: own rows select"
  on public.rabbit_bookmarks for select
  using (auth.uid() = user_id);

create policy "rabbit_bookmarks: own rows insert"
  on public.rabbit_bookmarks for insert
  with check (auth.uid() = user_id);

create policy "rabbit_bookmarks: own rows delete"
  on public.rabbit_bookmarks for delete
  using (auth.uid() = user_id);
