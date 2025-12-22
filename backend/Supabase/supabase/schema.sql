-- Extensions
create extension if not exists pgcrypto with schema public;

-- ========== Core Tables ==========
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
  created_at timestamptz default now()
);

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
  created_at timestamptz default now(),
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
  created_at timestamptz default now()
);

-- Follows
create table if not exists public.following (
  follower uuid references public."user"(uid) on delete cascade,
  following uuid references public."user"(uid) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower, following)
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
  created_at timestamptz default now()
);

-- ========== Triggers ==========
-- New auth user -> profile row
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."user" (uid, email, "displayName", "photoURL")
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'displayName', ''),
    coalesce(new.raw_user_meta_data ->> 'picture', '')
  )
  on conflict (uid) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Post like counts (post + creator likesCount)
create or replace function public.handle_post_like()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.post
      set "likesCount" = "likesCount" + 1
      where id = new.post_id;

    update public."user"
      set "likesCount" = greatest(0, "likesCount" + 1)
      where uid = (select creator from public.post where id = new.post_id);

    return new;
  elsif tg_op = 'DELETE' then
    update public.post
      set "likesCount" = greatest(0, "likesCount" - 1)
      where id = old.post_id;

    update public."user"
      set "likesCount" = greatest(0, "likesCount" - 1)
      where uid = (select creator from public.post where id = old.post_id);

    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists post_like_counts on public.post_likes;
create trigger post_like_counts
after insert or delete on public.post_likes
for each row execute function public.handle_post_like();

-- Post comment counts
create or replace function public.handle_post_comment()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.post
      set "commentsCount" = "commentsCount" + 1
      where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.post
      set "commentsCount" = greatest(0, "commentsCount" - 1)
      where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists post_comment_counts on public.post_comments;
create trigger post_comment_counts
after insert or delete on public.post_comments
for each row execute function public.handle_post_comment();

-- Follow/follower counters
create or replace function public.handle_follow_counts()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public."user"
      set "followersCount" = "followersCount" + 1
      where uid = new.following;

    update public."user"
      set "followingCount" = "followingCount" + 1
      where uid = new.follower;

    return new;
  elsif tg_op = 'DELETE' then
    update public."user"
      set "followersCount" = greatest(0, "followersCount" - 1)
      where uid = old.following;

    update public."user"
      set "followingCount" = greatest(0, "followingCount" - 1)
      where uid = old.follower;

    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists follow_counts on public.following;
create trigger follow_counts
after insert or delete on public.following
for each row execute function public.handle_follow_counts();

-- ========== RLS ==========
alter table public."user" enable row level security;
alter table public.post enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.following enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Users
drop policy if exists "Users can read profiles" on public."user";
create policy "Users can read profiles" on public."user"
  for select using (true);

drop policy if exists "Users can update own profile" on public."user";
create policy "Users can update own profile" on public."user"
  for update to authenticated using ((select auth.uid()) = uid);

-- Posts
drop policy if exists "Posts readable" on public.post;
create policy "Posts readable" on public.post
  for select using (true);

drop policy if exists "Create own posts" on public.post;
create policy "Create own posts" on public.post
  for insert to authenticated with check ((select auth.uid()) = creator);

drop policy if exists "Update own posts" on public.post;
create policy "Update own posts" on public.post
  for update to authenticated using ((select auth.uid()) = creator);

drop policy if exists "Delete own posts" on public.post;
create policy "Delete own posts" on public.post
  for delete to authenticated using ((select auth.uid()) = creator);

-- Likes
drop policy if exists "Read likes" on public.post_likes;
create policy "Read likes" on public.post_likes
  for select using (true);

drop policy if exists "Like as self" on public.post_likes;
create policy "Like as self" on public.post_likes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Remove own like" on public.post_likes;
create policy "Remove own like" on public.post_likes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Comments
drop policy if exists "Read comments" on public.post_comments;
create policy "Read comments" on public.post_comments
  for select using (true);

drop policy if exists "Comment as self" on public.post_comments;
create policy "Comment as self" on public.post_comments
  for insert to authenticated with check ((select auth.uid()) = creator);

drop policy if exists "Remove own comment" on public.post_comments;
create policy "Remove own comment" on public.post_comments
  for delete to authenticated using ((select auth.uid()) = creator);

-- Following
drop policy if exists "Read following" on public.following;
create policy "Read following" on public.following
  for select using (true);

drop policy if exists "Follow as self" on public.following;
create policy "Follow as self" on public.following
  for insert to authenticated with check ((select auth.uid()) = follower);

drop policy if exists "Unfollow as self" on public.following;
create policy "Unfollow as self" on public.following
  for delete to authenticated using ((select auth.uid()) = follower);

-- Chats
drop policy if exists "Read chats when member" on public.chats;
create policy "Read chats when member" on public.chats
  for select to authenticated using ((select auth.uid()) = any(members));

drop policy if exists "Create chat you belong to" on public.chats;
create policy "Create chat you belong to" on public.chats
  for insert to authenticated with check ((select auth.uid()) = any(members));

drop policy if exists "Update chat when member" on public.chats;
create policy "Update chat when member" on public.chats
  for update to authenticated using ((select auth.uid()) = any(members));

-- Messages
drop policy if exists "Read messages for member" on public.messages;
create policy "Read messages for member" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (select auth.uid()) = any(c.members)
    )
  );

drop policy if exists "Send message as member" on public.messages;
create policy "Send message as member" on public.messages
  for insert to authenticated with check (
    exists (
      select 1 from public.chats c
      where c.id = chat_id and (select auth.uid()) = any(c.members)
    )
    and (select auth.uid()) = creator
  );

drop policy if exists "Delete own message" on public.messages;
create policy "Delete own message" on public.messages
  for delete to authenticated using ((select auth.uid()) = creator);

-- ========== Helpful Indexes (idempotent) ==========
create index if not exists idx_post_creator on public.post(creator);
create index if not exists idx_post_likes_post on public.post_likes(post_id);
create index if not exists idx_post_likes_user on public.post_likes(user_id);
create index if not exists idx_post_comments_post on public.post_comments(post_id);
create index if not exists idx_post_comments_creator on public.post_comments(creator);
create index if not exists idx_following_follower on public.following(follower);
create index if not exists idx_following_following on public.following(following);
create index if not exists idx_messages_chat on public.messages(chat_id);
create index if not exists idx_messages_creator on public.messages(creator);
