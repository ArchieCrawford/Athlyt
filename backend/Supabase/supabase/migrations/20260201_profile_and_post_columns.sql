alter table public.post add column if not exists media_path text;
alter table public.post add column if not exists thumb_path text;

alter table public."user" enable row level security;

drop policy if exists "Users can insert own profile" on public."user";
create policy "Users can insert own profile"
  on public."user"
  for insert
  with check (auth.uid() = uid);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."user" (uid, email, "displayName")
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Athlete')
  )
  on conflict (uid) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
