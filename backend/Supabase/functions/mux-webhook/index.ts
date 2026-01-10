// Edge Function: Mux webhook handler to persist playback_id/asset_id on posts
// Expects env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (aliases supported)
// Expects env MUX_WEBHOOK_SECRET for signature verification
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

// Supabase CLI disallows secrets prefixed with SUPABASE_, so support aliases
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_SUPABASE_URL");
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("PROJECT_SUPABASE_SERVICE_ROLE_KEY");
const muxWebhookSecret = Deno.env.get("MUX_WEBHOOK_SECRET");

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase service role creds; set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
}

if (!muxWebhookSecret) {
  console.error("Missing Mux webhook secret; set MUX_WEBHOOK_SECRET");
}

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const encoder = new TextEncoder();
const MAX_SIGNATURE_AGE_SECONDS = 300;

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const timingSafeEqual = (a: string, b: string) => {
  const maxLength = Math.max(a.length, b.length);
  let result = a.length ^ b.length;
  for (let i = 0; i < maxLength; i += 1) {
    const aCode = i < a.length ? a.charCodeAt(i) : 0;
    const bCode = i < b.length ? b.charCodeAt(i) : 0;
    result |= aCode ^ bCode;
  }
  return result === 0;
};

const parseMuxSignature = (header: string | null) => {
  if (!header) return null;
  const parts = header.split(",");
  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t" && value) {
      timestamp = value;
    } else if (key === "v1" && value) {
      signatures.push(value);
    }
  }
  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
};

const verifyMuxSignature = async (
  secret: string,
  header: string | null,
  body: string,
) => {
  const parsed = parseMuxSignature(header);
  if (!parsed) return false;
  const timestamp = Number(parsed.timestamp);
  if (!Number.isFinite(timestamp)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > MAX_SIGNATURE_AGE_SECONDS) {
    console.error("Mux webhook signature timestamp out of range", {
      timestamp,
      now,
    });
    return false;
  }
  const payload = `${parsed.timestamp}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  const expected = toHex(signature);
  return parsed.signatures.some((sig) =>
    timingSafeEqual(sig.toLowerCase(), expected),
  );
};

const safeJsonParse = (value: unknown) => {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const updatePost = async (
  update: Record<string, unknown>,
  postId?: string,
  uploadId?: string,
) => {
  if (!supabase) {
    return { error: new Error("Missing Supabase client") };
  }
  if (postId) {
    return await supabase.from("post").update(update).eq("id", postId);
  }
  if (uploadId) {
    return await supabase
      .from("post")
      .update(update)
      .eq("mux_upload_id", uploadId);
  }
  return { error: null };
};

serve(async (req) => {
  if (!supabase) {
    return new Response("Server misconfigured", { status: 500 });
  }
  if (!muxWebhookSecret) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("mux-signature");
  const signatureValid = await verifyMuxSignature(
    muxWebhookSecret,
    signatureHeader,
    rawBody,
  );

  if (!signatureValid) {
    console.error("Mux webhook signature invalid");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return new Response(`Invalid JSON: ${String(e)}`, { status: 400 });
  }

  const type = payload?.type;
  const data = payload?.data;

  if (!type) {
    return new Response("ok", { status: 200 });
  }

  const passthroughObj =
    safeJsonParse(data?.passthrough) ??
    safeJsonParse(data?.asset?.passthrough) ??
    safeJsonParse(data?.upload?.passthrough);
  const postId: string | undefined =
    passthroughObj?.postId ?? passthroughObj?.post_id;

  if (type === "video.upload.asset_created") {
    const assetId: string | undefined = data?.asset_id ?? data?.asset?.id;
    const uploadId: string | undefined =
      data?.id ?? data?.upload_id ?? data?.upload?.id;
    if (!assetId) {
      return new Response("ok", { status: 200 });
    }
    if (!postId && !uploadId) {
      console.error("Mux webhook mapping failed", {
        type,
        postId,
        uploadId,
        assetId,
      });
      return new Response("Missing post mapping", { status: 400 });
    }

    const updateObj = {
      mux_asset_id: assetId,
      media_type: "video",
    };
    const { error } = await updatePost(updateObj, postId, uploadId);
    if (error) {
      console.error("Mux webhook asset_created update failed", error);
      return new Response("Update failed", { status: 500 });
    }
    console.log("Mux webhook update", {
      type,
      postId,
      uploadId,
      assetId,
      playbackId: undefined,
    });
    return new Response("ok", { status: 200 });
  }

  if (type === "video.asset.ready") {
    const assetId: string | undefined = data?.id;
    const playbackId: string | undefined = data?.playback_ids?.[0]?.id;
    const uploadId: string | undefined = data?.upload_id ?? data?.upload?.id;
    if (!assetId || !playbackId) {
      return new Response("ok", { status: 200 });
    }
    if (!postId && !uploadId) {
      console.error("Mux webhook mapping failed", {
        type,
        postId,
        uploadId,
        assetId,
        playbackId,
      });
      return new Response("Missing post mapping", { status: 400 });
    }

    const updateObj = {
      mux_playback_id: playbackId,
      mux_asset_id: assetId,
      media_type: "video",
    };
    const { error } = await updatePost(updateObj, postId, uploadId);
    if (error) {
      console.error("Mux webhook asset_ready update failed", error);
      return new Response("Update failed", { status: 500 });
    }
    console.log("Mux webhook update", {
      postId,
      uploadId,
      assetId,
      playbackId,
      type,
    });
  }

  return new Response("ok", { status: 200 });
});
