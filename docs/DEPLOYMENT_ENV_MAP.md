# Deployment Environment Map

## Expo / EAS (mobile)
Set these in EAS build environment (project secrets):
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET
- EXPO_PUBLIC_PRIVACY_URL
- EXPO_PUBLIC_TERMS_URL
- EXPO_PUBLIC_SUPPORT_URL

## Vercel (dashboard-admin)
Set these in Vercel Project Settings -> Environment Variables:
- NEXT_PUBLIC_SUPABASE_URL (if used)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (if used)
- NEXT_PUBLIC_SITE_URL or SITE_URL (canonical base URL)

## Render (worker)
Set these in Render service environment:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MUX_TOKEN_ID
- MUX_TOKEN_SECRET

## Do NOT put these in client environments
- SUPABASE_SERVICE_ROLE_KEY
- MUX_TOKEN_ID / MUX_TOKEN_SECRET
- EXPO_TOKEN (GitHub Actions)
