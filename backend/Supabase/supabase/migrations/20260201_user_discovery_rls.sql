do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'user'
  ) then
    execute 'alter table public."user" enable row level security';
    execute 'drop policy if exists "Authenticated can read profiles" on public."user"';
    execute 'create policy "Authenticated can read profiles" on public."user"
      for select
      to authenticated
      using (true)';
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    execute 'alter table public.profiles enable row level security';
    execute 'drop policy if exists "Authenticated can read profiles" on public.profiles';
    execute 'create policy "Authenticated can read profiles" on public.profiles
      for select
      to authenticated
      using (true)';
  end if;
end $$;
