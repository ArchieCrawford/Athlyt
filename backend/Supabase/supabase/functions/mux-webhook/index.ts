// Edge Function: Mux webhook handler to persist playback_id/asset_id on posts
// Expects env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (aliases supported)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

// Supabase CLI disallows secrets prefixed with SUPABASE_, so support aliases
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_SUPABASE_URL");
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("PROJECT_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase service role creds; set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

serve(async (req) => {
  if (!supabase) {
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(`Invalid JSON: ${e}`, { status: 400 });
  }

  const type = payload?.type;
  const data = payload?.data;

  // We only care when the asset is ready so we can store playback_id
  if (type === "video.asset.ready") {
    const assetId = data?.id;
    const playbackId = data?.playback_ids?.[0]?.id;
    const uploadId = data?.upload_id;

    if (assetId && playbackId) {
      const { error } = await supabase
        .from("post")
        .update({
          mux_playback_id: playbackId,
          mux_asset_id: assetId,
          media_type: "video",
        })
        .or(`mux_asset_id.eq.${assetId},mux_playback_id.is.null,mux_asset_id.is.null`);

      if (error) {
        console.error("Failed to persist mux ids", error);
        return new Response(error.message, { status: 500 });
      }
    }
  }

  return new Response("ok", { status: 200 });
});
