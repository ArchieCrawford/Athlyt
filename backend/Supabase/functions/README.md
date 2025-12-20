# Archived Supabase functions

This `backend/Supabase/functions/` folder previously duplicated the Supabase edge functions. The authoritative location is now:

```
backend/Supabase/supabase/functions/
```

The duplicate function files have been removed to avoid accidental deploys or drift. Deploy and edit functions only from the `supabase/functions` directory.
