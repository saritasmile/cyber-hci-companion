-- ============================================================
-- 001_initial_schema.sql
-- Cyber × HCI Learning Companion — initial database schema
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- USERS (profile extension of auth.users)
-- ────────────────────────────────────────────────────────────
create table public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;

create policy "users: own row read"
  on public.users for select
  using (auth.uid() = id);

create policy "users: own row update"
  on public.users for update
  using (auth.uid() = id);


-- ────────────────────────────────────────────────────────────
-- SAVED_NOTES
-- ────────────────────────────────────────────────────────────
create table public.saved_notes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  topic            text not null,
  depth            text not null check (depth in ('overview', 'working_knowledge', 'deep_dive')),
  analyst_content  jsonb,
  hci_content      jsonb,
  reflections      jsonb,   -- array of {question: string, answer: string}
  created_at       timestamptz not null default now()
);

create index saved_notes_user_id_idx on public.saved_notes (user_id);

alter table public.saved_notes enable row level security;

create policy "saved_notes: own rows select"
  on public.saved_notes for select
  using (auth.uid() = user_id);

create policy "saved_notes: own rows insert"
  on public.saved_notes for insert
  with check (auth.uid() = user_id);

create policy "saved_notes: own rows update"
  on public.saved_notes for update
  using (auth.uid() = user_id);

create policy "saved_notes: own rows delete"
  on public.saved_notes for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- KNOWLEDGE_MAP_ENTRIES
-- ────────────────────────────────────────────────────────────
create table public.knowledge_map_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  topic        text not null,
  module       text not null check (module in ('scenario', 'study', 'rabbit', 'patterns', 'scan')),
  depth_level  text not null check (depth_level in ('touched', 'explored', 'deep')),
  visit_count  integer not null default 1,
  last_visited timestamptz not null default now(),
  unique (user_id, topic, module)
);

create index knowledge_map_user_id_idx on public.knowledge_map_entries (user_id);

alter table public.knowledge_map_entries enable row level security;

create policy "knowledge_map: own rows select"
  on public.knowledge_map_entries for select
  using (auth.uid() = user_id);

create policy "knowledge_map: own rows insert"
  on public.knowledge_map_entries for insert
  with check (auth.uid() = user_id);

create policy "knowledge_map: own rows update"
  on public.knowledge_map_entries for update
  using (auth.uid() = user_id);

create policy "knowledge_map: own rows delete"
  on public.knowledge_map_entries for delete
  using (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- SCENARIO_CACHE
-- ────────────────────────────────────────────────────────────
create table public.scenario_cache (
  id           uuid primary key default gen_random_uuid(),
  scenario_id  text not null unique,  -- e.g. 'salt-typhoon'
  analysis     jsonb not null,
  generated_at timestamptz not null default now(),
  expires_at   timestamptz not null
);

create index scenario_cache_scenario_id_idx on public.scenario_cache (scenario_id);
create index scenario_cache_expires_at_idx  on public.scenario_cache (expires_at);

alter table public.scenario_cache enable row level security;

-- All authenticated users can read cached scenarios; only service role writes
create policy "scenario_cache: authenticated read"
  on public.scenario_cache for select
  to authenticated
  using (true);


-- ────────────────────────────────────────────────────────────
-- FEED_ITEMS
-- ────────────────────────────────────────────────────────────
create table public.feed_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  source       text not null,
  excerpt      text not null,
  url          text,
  lens         text not null check (lens in ('analyst', 'hci', 'commander')),
  effort       text not null check (effort in ('5min', '15min', 'deep')),
  topic        text not null,
  published_at timestamptz not null default now(),
  is_featured  boolean not null default false
);

create index feed_items_lens_idx        on public.feed_items (lens);
create index feed_items_published_at_idx on public.feed_items (published_at desc);
create index feed_items_is_featured_idx  on public.feed_items (is_featured) where is_featured = true;

alter table public.feed_items enable row level security;

-- All authenticated users can read feed items; only service role writes
create policy "feed_items: authenticated read"
  on public.feed_items for select
  to authenticated
  using (true);


-- ────────────────────────────────────────────────────────────
-- PATTERN_ANNOTATIONS
-- ────────────────────────────────────────────────────────────
create table public.pattern_annotations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  pattern_id text not null,
  notes      text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, pattern_id)
);

create trigger pattern_annotations_updated_at
  before update on public.pattern_annotations
  for each row execute procedure public.set_updated_at();

create index pattern_annotations_user_id_idx on public.pattern_annotations (user_id);

alter table public.pattern_annotations enable row level security;

create policy "pattern_annotations: own rows select"
  on public.pattern_annotations for select
  using (auth.uid() = user_id);

create policy "pattern_annotations: own rows insert"
  on public.pattern_annotations for insert
  with check (auth.uid() = user_id);

create policy "pattern_annotations: own rows update"
  on public.pattern_annotations for update
  using (auth.uid() = user_id);

create policy "pattern_annotations: own rows delete"
  on public.pattern_annotations for delete
  using (auth.uid() = user_id);
