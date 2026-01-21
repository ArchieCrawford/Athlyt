import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const normalizeMediaArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token || token !== supabaseServiceKey) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const nowIso = new Date().toISOString();

  const { data: scheduledRows, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("id, owner, payload, status, run_at")
    .eq("status", "scheduled")
    .lte("run_at", nowIso)
    .order("run_at", { ascending: true })
    .limit(25);

  if (fetchError) {
    console.error("Failed to load scheduled posts", fetchError);
    return new Response("Failed to load scheduled posts", {
      status: 500,
      headers: corsHeaders,
    });
  }

  let processed = 0;
  let posted = 0;
  let failed = 0;

  for (const row of scheduledRows ?? []) {
    processed += 1;
    const { data: claimedRow } = await supabase
      .from("scheduled_posts")
      .update({ status: "running" })
      .eq("id", row.id)
      .eq("status", "scheduled")
      .select("id, owner, payload")
      .maybeSingle();

    if (!claimedRow) {
      continue;
    }

    try {
      const payload = claimedRow.payload as Record<string, unknown>;
      const media = normalizeMediaArray(payload?.media);
      const mediaType = payload?.media_type;

      if (!media.length || (mediaType !== "image" && mediaType !== "video")) {
        throw new Error("Invalid payload");
      }

      const description =
        typeof payload.description === "string" ? payload.description : "";
      const muxPlaybackId =
        typeof payload.mux_playback_id === "string"
          ? payload.mux_playback_id
          : null;
      const posterUrl =
        typeof payload.poster_url === "string" ? payload.poster_url : null;

      const { data: postRow, error: postError } = await supabase
        .from("post")
        .insert({
          creator: claimedRow.owner,
          media,
          description,
          media_type: mediaType,
          mux_playback_id: muxPlaybackId,
          poster_url: posterUrl,
          likesCount: 0,
          commentsCount: 0,
          creation: nowIso,
        })
        .select("id")
        .single();

      if (postError || !postRow) {
        throw postError ?? new Error("Post insert failed");
      }

      await supabase
        .from("scheduled_posts")
        .update({
          status: "posted",
          posted_post_id: postRow.id,
          last_error: null,
        })
        .eq("id", claimedRow.id);
      posted += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to post";
      await supabase
        .from("scheduled_posts")
        .update({ status: "failed", last_error: message })
        .eq("id", claimedRow.id);
      failed += 1;
    }
  }

  return new Response(
    JSON.stringify({ processed, posted, failed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
