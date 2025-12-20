// supabase/functions/mux-webhook/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_SUPABASE_URL");
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("PROJECT_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase creds. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or PROJECT_* aliases).",
  );
}

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function safeJsonParse(v: unknown) {
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (!supabase) return new Response("Server misconfigured", { status: 500 });

  let payload: any;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(`Invalid JSON: ${String(e)}`, { status: 400 });
  }

  const type = payload?.type;
  const data = payload?.data;

  if (type !== "video.asset.ready") {
    return new Response("ok", { status: 200 });
  }

  const assetId: string | undefined = data?.id;
  const playbackId: string | undefined = data?.playback_ids?.[0]?.id;
  const uploadId: string | undefined = data?.upload_id;

  const passthroughObj =
    safeJsonParse(data?.passthrough) ?? safeJsonParse(data?.upload?.passthrough);
  const postId: string | undefined = passthroughObj?.post_id;

  if (!assetId || !playbackId) {
    return new Response("Missing assetId/playbackId", { status: 200 });
  }

  const updateObj = {
    mux_playback_id: playbackId,
    mux_asset_id: assetId,
    media_type: "video",
  };

  // 1) Best: deterministic by post_id from passthrough
  if (postId) {
    const { error } = await supabase.from("post").update(updateObj).eq("id", postId);
    if (error) {
      console.error("Mux webhook update failed (post_id)", error);
      return new Response(error.message, { status: 500 });
    }
    return new Response("ok", { status: 200 });
  }

  // 2) Next best: deterministic by upload_id stored on post
  if (uploadId) {
    const { error } = await supabase
      .from("post")
      .update(updateObj)
      .eq("mux_upload_id", uploadId);

    if (!error) return new Response("ok", { status: 200 });

    console.error("Mux webhook update failed (mux_upload_id)", error);
    return new Response(error.message, { status: 500 });
  }

  // 3) Last resort: strict match only (no null wildcards)
  // Only run if we have at least one strict key to match on.
  const orParts: string[] = [];
  if (assetId) orParts.push(`mux_asset_id.eq.${assetId}`);
  if (playbackId) orParts.push(`mux_playback_id.eq.${playbackId}`);

  if (orParts.length === 0) return new Response("ok", { status: 200 });

  const { error } = await supabase
    .from("post")
    .update(updateObj)
    .or(orParts.join(","));

  if (error) {
    console.error("Mux webhook update failed (strict fallback)", error);
    return new Response(error.message, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
