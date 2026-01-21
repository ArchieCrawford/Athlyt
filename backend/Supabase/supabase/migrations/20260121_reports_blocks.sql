create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_uid uuid not null references public."user"(uid) on delete cascade,
  target_type text not null check (target_type in ('post', 'user')),
  target_id uuid not null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists reports_reporter_idx
  on public.reports (reporter_uid, created_at desc);
create index if not exists reports_target_idx
  on public.reports (target_type, target_id);

create table if not exists public.blocks (
  blocker_uid uuid not null references public."user"(uid) on delete cascade,
  blocked_uid uuid not null references public."user"(uid) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_uid, blocked_uid)
);

create index if not exists blocks_blocker_idx
  on public.blocks (blocker_uid);
create index if not exists blocks_blocked_idx
  on public.blocks (blocked_uid);

alter table public.reports enable row level security;
alter table public.blocks enable row level security;

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_uid);

drop policy if exists "reports_admin_select" on public.reports;
create policy "reports_admin_select" on public.reports
  for select using (
    exists (
      select 1 from public.admin_users a where a.uid = auth.uid()
    )
  );

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks
  for select using (auth.uid() = blocker_uid);

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own" on public.blocks
  for insert with check (auth.uid() = blocker_uid);

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own" on public.blocks
  for delete using (auth.uid() = blocker_uid);
