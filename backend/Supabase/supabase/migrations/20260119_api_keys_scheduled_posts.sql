create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  label text,
  key_hash text not null,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create unique index if not exists api_keys_key_hash_idx
  on public.api_keys (key_hash);
create index if not exists api_keys_owner_idx
  on public.api_keys (owner);
create index if not exists api_keys_owner_revoked_idx
  on public.api_keys (owner, revoked_at);

create table if not exists public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  run_at timestamptz not null,
  payload jsonb not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'running', 'posted', 'failed', 'canceled')),
  posted_post_id uuid references public.post(id),
  last_error text,
  created_at timestamptz default now()
);

create index if not exists scheduled_posts_owner_idx
  on public.scheduled_posts (owner);
create index if not exists scheduled_posts_owner_run_at_idx
  on public.scheduled_posts (owner, run_at desc);
create index if not exists scheduled_posts_status_run_at_idx
  on public.scheduled_posts (status, run_at);

alter table public.api_keys enable row level security;
alter table public.scheduled_posts enable row level security;

drop policy if exists "api_keys_owner_select" on public.api_keys;
create policy "api_keys_owner_select" on public.api_keys
  for select using (auth.uid() = owner);

drop policy if exists "api_keys_owner_insert" on public.api_keys;
create policy "api_keys_owner_insert" on public.api_keys
  for insert with check (auth.uid() = owner);

drop policy if exists "api_keys_owner_update" on public.api_keys;
create policy "api_keys_owner_update" on public.api_keys
  for update using (auth.uid() = owner)
  with check (auth.uid() = owner);

drop policy if exists "api_keys_owner_delete" on public.api_keys;
create policy "api_keys_owner_delete" on public.api_keys
  for delete using (auth.uid() = owner);

drop policy if exists "scheduled_posts_owner_select" on public.scheduled_posts;
create policy "scheduled_posts_owner_select" on public.scheduled_posts
  for select using (auth.uid() = owner);

drop policy if exists "scheduled_posts_owner_insert" on public.scheduled_posts;
create policy "scheduled_posts_owner_insert" on public.scheduled_posts
  for insert with check (auth.uid() = owner);

drop policy if exists "scheduled_posts_owner_update" on public.scheduled_posts;
create policy "scheduled_posts_owner_update" on public.scheduled_posts
  for update using (auth.uid() = owner)
  with check (auth.uid() = owner);

drop policy if exists "scheduled_posts_owner_delete" on public.scheduled_posts;
create policy "scheduled_posts_owner_delete" on public.scheduled_posts
  for delete using (auth.uid() = owner);
