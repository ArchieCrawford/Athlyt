# Mux Edge Functions (Supabase)

Functions added:
- `mux-create-upload`: returns a Mux direct-upload URL ({ uploadUrl, uploadId }). Accepts optional JSON body `{ postId }` to set passthrough for webhook linkage.
- `mux-webhook`: handles Mux webhooks (stores mux_playback_id / mux_asset_id on `post`).

Required secrets (set via `supabase secrets set` in the functions folder):
- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`
- `PROJECT_SUPABASE_URL` (alias for SUPABASE_URL, because SUPABASE_* is reserved)
- `PROJECT_SUPABASE_SERVICE_ROLE_KEY` (alias for SUPABASE_SERVICE_ROLE_KEY)

Deploy/run example:
```bash
supabase functions deploy mux-create-upload --project-ref <your-ref>
supabase functions deploy mux-webhook --project-ref <your-ref>
```

Mux webhook URL to register in Mux Dashboard:
```
https://<project-ref>.functions.supabase.co/mux-webhook
```

Function config note:
- `mux-webhook` must have JWT verification disabled (see `backend/Supabase/supabase/config.toml`).

Schema note: `public.post` now includes `media_type`, `mux_playback_id`, `mux_asset_id`, `poster_url`.
