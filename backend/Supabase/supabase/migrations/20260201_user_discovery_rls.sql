alter table public."user" enable row level security;

drop policy if exists "Authenticated can read profiles" on public."user";
create policy "Authenticated can read profiles"
  on public."user"
  for select
  to authenticated
  using (true);
