create extension if not exists vector;

alter table public.post
  add column if not exists sport text,
  add column if not exists team text,
  add column if not exists is_public boolean not null default true,
  add column if not exists is_deleted boolean not null default false;

create table if not exists public.events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  user_id uuid references public."user"(uid) on delete set null,
  post_id uuid references public.post(id) on delete cascade,
  event_type text not null check (event_type in (
    'view','watch_time','complete','like','unlike','comment','share','follow','unfollow','hide','report'
  )),
  value_num double precision,
  value_text text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists events_user_created_idx
  on public.events (user_id, created_at desc);
create index if not exists events_post_created_idx
  on public.events (post_id, created_at desc);
create index if not exists events_type_created_idx
  on public.events (event_type, created_at desc);

create table if not exists public.hashtags (
  id bigserial primary key,
  tag text not null unique,
  created_at timestamptz not null default now(),
  usage_count bigint not null default 0,
  last_used_at timestamptz,
  sport text,
  team text
);

create table if not exists public.post_hashtags (
  post_id uuid not null references public.post(id) on delete cascade,
  hashtag_id bigint not null references public.hashtags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, hashtag_id)
);

create index if not exists post_hashtags_hashtag_idx
  on public.post_hashtags (hashtag_id, created_at desc);

create table if not exists public.post_embeddings (
  post_id uuid primary key references public.post(id) on delete cascade,
  created_at timestamptz not null default now(),
  model text not null,
  content_hash text not null,
  embedding vector(1536)
);

create index if not exists post_embeddings_vec_idx
  on public.post_embeddings using ivfflat (embedding vector_cosine_ops);

create table if not exists public.user_interest_vectors (
  user_id uuid primary key references public."user"(uid) on delete cascade,
  updated_at timestamptz not null default now(),
  model text not null,
  embedding vector(1536)
);

create table if not exists public.user_blocks (
  user_id uuid not null references public."user"(uid) on delete cascade,
  blocked_user_id uuid not null references public."user"(uid) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_user_id)
);

alter table public.events enable row level security;
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.post_embeddings enable row level security;
alter table public.user_interest_vectors enable row level security;
alter table public.user_blocks enable row level security;

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events
  for insert with check (auth.uid() = user_id);

drop policy if exists "hashtags_read" on public.hashtags;
create policy "hashtags_read" on public.hashtags
  for select using (true);

drop policy if exists "post_hashtags_read" on public.post_hashtags;
create policy "post_hashtags_read" on public.post_hashtags
  for select using (true);

drop policy if exists "user_interest_read_own" on public.user_interest_vectors;
create policy "user_interest_read_own" on public.user_interest_vectors
  for select using (auth.uid() = user_id);

drop policy if exists "blocks_read_own" on public.user_blocks;
create policy "blocks_read_own" on public.user_blocks
  for select using (auth.uid() = user_id);

drop policy if exists "blocks_insert_own" on public.user_blocks;
create policy "blocks_insert_own" on public.user_blocks
  for insert with check (auth.uid() = user_id);

drop policy if exists "blocks_delete_own" on public.user_blocks;
create policy "blocks_delete_own" on public.user_blocks
  for delete using (auth.uid() = user_id);

create or replace function public.normalize_hashtag(raw text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(raw)), '[^a-z0-9_]', '', 'g')
$$;

create or replace function public.extract_hashtags(caption text)
returns text[]
language plpgsql
immutable
as $$
declare
  matches text[];
begin
  if caption is null then
    return ARRAY[]::text[];
  end if;

  select array_agg(distinct public.normalize_hashtag(m[1]))
  into matches
  from regexp_matches(caption, '#([A-Za-z0-9_]+)', 'g') as m;

  return coalesce(matches, ARRAY[]::text[]);
end;
$$;

create or replace function public.upsert_post_hashtags(
  p_post_id uuid,
  p_caption text,
  p_sport text default null,
  p_team text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tags text[];
  t text;
  hid bigint;
begin
  delete from public.post_hashtags where post_id = p_post_id;

  tags := public.extract_hashtags(p_caption);

  foreach t in array tags loop
    if t is null or length(t) = 0 then
      continue;
    end if;

    insert into public.hashtags(tag, sport, team, usage_count, last_used_at)
    values (t, p_sport, p_team, 1, now())
    on conflict (tag) do update
      set usage_count = public.hashtags.usage_count + 1,
          last_used_at = now(),
          sport = coalesce(public.hashtags.sport, excluded.sport),
          team = coalesce(public.hashtags.team, excluded.team)
    returning id into hid;

    insert into public.post_hashtags(post_id, hashtag_id)
    values (p_post_id, hid)
    on conflict do nothing;
  end loop;
end;
$$;

create or replace view public.post_metrics_7d as
with e as (
  select
    post_id,
    sum(case when event_type = 'view' then 1 else 0 end) as views,
    sum(case when event_type = 'complete' then 1 else 0 end) as completes,
    sum(case when event_type = 'like' then 1 else 0 end) as likes,
    sum(case when event_type = 'share' then 1 else 0 end) as shares,
    sum(case when event_type = 'watch_time' then coalesce(value_num,0) else 0 end) as watch_seconds
  from public.events
  where created_at > now() - interval '7 days'
  group by post_id
)
select
  p.id as post_id,
  coalesce(e.views,0) as views_7d,
  coalesce(e.completes,0) as completes_7d,
  coalesce(e.likes,0) as likes_7d,
  coalesce(e.shares,0) as shares_7d,
  coalesce(e.watch_seconds,0) as watch_seconds_7d,
  case when coalesce(e.views,0) = 0
    then 0
    else (coalesce(e.completes,0)::double precision / e.views::double precision)
  end as completion_rate_7d,
  (coalesce(e.watch_seconds,0) / greatest(coalesce(e.views,0),1)) as avg_watch_seconds_7d,
  p.creation as created_at,
  p.sport,
  p.team
from public.post p
left join e on e.post_id = p.id
where p.is_public = true and p.is_deleted = false;

create or replace function public.match_posts_for_user(
  query_embedding vector(1536),
  match_count int
)
returns table(post_id uuid, distance double precision)
language sql
stable
as $$
  select
    pe.post_id,
    (pe.embedding <=> query_embedding) as distance
  from public.post_embeddings pe
  join public.post p on p.id = pe.post_id
  where p.is_public = true and p.is_deleted = false
  order by pe.embedding <=> query_embedding
  limit match_count
$$;

create or replace function public.match_posts_by_embedding(
  query_embedding vector(1536),
  match_count int
)
returns table(post_id uuid, distance double precision)
language sql
stable
as $$
  select
    pe.post_id,
    (pe.embedding <=> query_embedding) as distance
  from public.post_embeddings pe
  join public.post p on p.id = pe.post_id
  where p.is_public = true and p.is_deleted = false
  order by pe.embedding <=> query_embedding
  limit match_count
$$;
