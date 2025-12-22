-- Supabase schema to replace Firebase backend
-- Run this inside your Supabase project's SQL editor

-- Profiles
create table if not exists public."user" (
  uid uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  "displayName" text,
  "photoURL" text,
  bio text,
  "followingCount" integer default 0,
  "followersCount" integer default 0,
  "likesCount" integer default 0,
  "createdAt" timestamptz default now()
);

-- Admin users (dashboard access)
create table if not exists public.admin_users (
  uid uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- App events
create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public."user"(uid),
  event text not null,
  props jsonb,
  created_at timestamptz default now()
);

-- Auth events
create table if not exists public.auth_events (
  id uuid primary key default gen_random_uuid(),
  email text,
  user_id uuid references public."user"(uid),
  event text not null,
  error text,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;
alter table public.app_events enable row level security;
alter table public.auth_events enable row level security;

drop policy if exists "Admins can select admin_users" on public.admin_users;
create policy "Admins can select admin_users"
  on public.admin_users
  for select
  using (exists (select 1 from public.admin_users a where a.uid = auth.uid()));

drop policy if exists "Admins select app_events" on public.app_events;
create policy "Admins select app_events"
  on public.app_events
  for select
  using (exists (select 1 from public.admin_users a where a.uid = auth.uid()));

drop policy if exists "Users insert own app_events" on public.app_events;
create policy "Users insert own app_events"
  on public.app_events
  for insert
  with check (
    (auth.uid() is not null and (user_id is null or user_id = auth.uid()))
    or (auth.uid() is null and user_id is null)
  );

drop policy if exists "Admins select auth_events" on public.auth_events;
create policy "Admins select auth_events"
  on public.auth_events
  for select
  using (exists (select 1 from public.admin_users a where a.uid = auth.uid()));

drop policy if exists "Insert auth_events" on public.auth_events;
create policy "Insert auth_events"
  on public.auth_events
  for insert
  with check (true);

create index if not exists app_events_created_idx on public.app_events (created_at);
create index if not exists app_events_event_idx on public.app_events (event);
create index if not exists app_events_user_idx on public.app_events (user_id);
create index if not exists app_events_session_idx on public.app_events (session_id);

create index if not exists auth_events_created_idx on public.auth_events (created_at);
create index if not exists auth_events_event_idx on public.auth_events (event);
create index if not exists auth_events_email_idx on public.auth_events (email);

-- Posts
create table if not exists public.post (
  id uuid primary key default gen_random_uuid(),
  creator uuid references public."user"(uid) on delete cascade,
  media text[] not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  mux_playback_id text,
  mux_asset_id text,
  mux_upload_id text,
  poster_url text,
  description text,
  "likesCount" integer default 0,
  "commentsCount" integer default 0,
  creation timestamptz default now()
);

-- Likes
create table if not exists public.post_likes (
  post_id uuid references public.post(id) on delete cascade,
  user_id uuid references public."user"(uid) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- Comments
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.post(id) on delete cascade,
  creator uuid references public."user"(uid) on delete cascade,
  comment text not null,
  creation timestamptz default now()
);

-- Follows
create table if not exists public.following (
  follower_id uuid references public."user"(uid) on delete cascade,
  user_id uuid references public."user"(uid) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, user_id)
);

-- Chats and messages
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  members uuid[] not null,
  "lastMessage" text default '',
  "lastUpdate" timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  creator uuid references public."user"(uid) on delete cascade,
  message text not null,
  creation timestamptz default now()
);

-- Trigger: create profile row when a new auth user is created
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public."user" (uid, email, "displayName", "photoURL")
  values (new.id, new.email, new.raw_user_meta_data ->> 'displayName', new.raw_user_meta_data ->> 'picture')
  on conflict (uid) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Trigger: keep like counts in sync on posts and creators
create or replace function public.handle_post_like()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.post set "likesCount" = "likesCount" + 1 where id = new.post_id;
    update public."user" u
      set "likesCount" = greatest(0, "likesCount" + 1)
      where uid = (select creator from public.post where id = new.post_id);
    return new;
  elsif tg_op = 'DELETE' then
    update public.post set "likesCount" = greatest(0, "likesCount" - 1) where id = old.post_id;
    update public."user" u
      set "likesCount" = greatest(0, "likesCount" - 1)
      where uid = (select creator from public.post where id = old.post_id);
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists post_like_counts on public.post_likes;
create trigger post_like_counts
after insert or delete on public.post_likes
for each row execute function public.handle_post_like();

-- Trigger: keep comment counts in sync
create or replace function public.handle_post_comment()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.post set "commentsCount" = "commentsCount" + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.post set "commentsCount" = greatest(0, "commentsCount" - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists post_comment_counts on public.post_comments;
create trigger post_comment_counts
after insert or delete on public.post_comments
for each row execute function public.handle_post_comment();

-- Trigger: keep follower/following counts in sync
create or replace function public.handle_follow_counts()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public."user" set "followersCount" = "followersCount" + 1 where uid = new.user_id;
    update public."user" set "followingCount" = "followingCount" + 1 where uid = new.follower_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public."user" set "followersCount" = greatest(0, "followersCount" - 1) where uid = old.user_id;
    update public."user" set "followingCount" = greatest(0, "followingCount" - 1) where uid = old.follower_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists follow_counts on public.following;
create trigger follow_counts
after insert or delete on public.following
for each row execute function public.handle_follow_counts();

-- Row level security policies
alter table public."user" enable row level security;
alter table public.post enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.following enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

create policy "Users can read profiles" on public."user"
  for select using (true);
create policy "Users can update own profile" on public."user"
  for update using (auth.uid() = uid);

create policy "Posts readable" on public.post
  for select using (true);
create policy "Create own posts" on public.post
  for insert with check (auth.uid() = creator);
create policy "Update own posts" on public.post
  for update using (auth.uid() = creator);
create policy "Delete own posts" on public.post
  for delete using (auth.uid() = creator);

create policy "Read likes" on public.post_likes for select using (true);
create policy "Like as self" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Remove own like" on public.post_likes for delete using (auth.uid() = user_id);

create policy "Read comments" on public.post_comments for select using (true);
create policy "Comment as self" on public.post_comments for insert with check (auth.uid() = creator);
create policy "Remove own comment" on public.post_comments for delete using (auth.uid() = creator);

create policy "Read following" on public.following for select using (true);
create policy "Follow as self" on public.following for insert with check (auth.uid() = follower_id);
create policy "Unfollow as self" on public.following for delete using (auth.uid() = follower_id);

create policy "Read chats when member" on public.chats
  for select using (auth.uid() = any(members));
create policy "Create chat you belong to" on public.chats
  for insert with check (auth.uid() = any(members));
create policy "Update chat when member" on public.chats
  for update using (auth.uid() = any(members));

create policy "Read messages for member" on public.messages
  for select using (exists (select 1 from public.chats c where c.id = chat_id and auth.uid() = any(c.members)));
create policy "Send message as member" on public.messages
  for insert with check (exists (select 1 from public.chats c where c.id = chat_id and auth.uid() = any(c.members)) and auth.uid() = creator);
create policy "Delete own message" on public.messages
  for delete using (auth.uid() = creator);
