# Tayp Admin Dashboard

Next.js App Router admin dashboard for Tayp (Supabase).

## Env
Copy `.env.example` to `.env` and set:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE=
```
Service role is server-only; never expose it to the mobile app.

## Run
```
npm install
npm run dev
```
Login at `/login` (Supabase email/password). Only users whose uid is in `public.admin_users` can view the dashboard.

## Metrics shown
- Totals: users, posts, photos, videos, comments, likes, follows
- 7d trends: new users, app opens, login fails
- Avg session duration (approx, from app_events session spans)

## Admin seed
Insert your uid once:
```sql
insert into public.admin_users (uid) values ('<ADMIN_UID>') on conflict do nothing;
```
