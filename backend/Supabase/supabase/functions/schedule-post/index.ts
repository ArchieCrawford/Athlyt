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

const encoder = new TextEncoder();

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const toIsoString = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
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

  if (!token) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const tokenHash = await sha256Hex(token);

  const { data: apiKeyRow, error: apiKeyError } = await supabase
    .from("api_keys")
    .select("id, owner, revoked_at")
    .eq("key_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (apiKeyError || !apiKeyRow) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  let payloadBody:
    | {
        run_at?: string;
        payload?: Record<string, unknown>;
      }
    | undefined;
  try {
    payloadBody = await req.json();
  } catch {
    payloadBody = undefined;
  }

  const runAtRaw = payloadBody?.run_at ?? "";
  const runAt = typeof runAtRaw === "string" ? toIsoString(runAtRaw) : null;
  if (!runAt) {
    return new Response("Invalid run_at", { status: 400, headers: corsHeaders });
  }

  const payload =
    payloadBody?.payload && typeof payloadBody.payload === "object"
      ? payloadBody.payload
      : null;

  if (!payload) {
    return new Response("Invalid payload", { status: 400, headers: corsHeaders });
  }

  const mediaType = (payload.media_type as string | undefined) ?? "";
  const media = payload.media;
  const mediaArray = Array.isArray(media)
    ? media.filter((item) => typeof item === "string")
    : [];

  if (!mediaArray.length || (mediaType !== "image" && mediaType !== "video")) {
    return new Response("Invalid payload", { status: 400, headers: corsHeaders });
  }

  const description =
    typeof payload.description === "string" ? payload.description : "";
  const muxPlaybackId =
    typeof payload.mux_playback_id === "string" ? payload.mux_playback_id : null;
  const posterUrl =
    typeof payload.poster_url === "string" ? payload.poster_url : null;

  const cleanedPayload = {
    ...payload,
    description,
    media: mediaArray,
    media_type: mediaType,
    mux_playback_id: muxPlaybackId,
    poster_url: posterUrl,
  };

  const { data: scheduledRow, error: insertError } = await supabase
    .from("scheduled_posts")
    .insert({
      owner: apiKeyRow.owner,
      run_at: runAt,
      payload: cleanedPayload,
      status: "scheduled",
    })
    .select("id, owner, run_at, status")
    .single();

  if (insertError) {
    console.error("Failed to schedule post", insertError);
    return new Response("Failed to schedule post", {
      status: 500,
      headers: corsHeaders,
    });
  }

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKeyRow.id);

  return new Response(JSON.stringify({ scheduled_post: scheduledRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
