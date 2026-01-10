import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const muxTokenId = Deno.env.get("MUX_TOKEN_ID");
const muxTokenSecret = Deno.env.get("MUX_TOKEN_SECRET");
const muxBase = "https://api.mux.com/video/v1";

serve(async (req) => {
  if (!muxTokenId || !muxTokenSecret) {
    console.error("Missing Mux credentials; set MUX_TOKEN_ID and MUX_TOKEN_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload: { postId?: string } | null = null;
  try {
    payload = await req.json();
  } catch {
    payload = null;
  }

  const postId = payload?.postId;
  const passthrough = postId ? JSON.stringify({ postId }) : undefined;

  const res = await fetch(`${muxBase}/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${muxTokenId}:${muxTokenSecret}`),
    },
    body: JSON.stringify({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        ...(passthrough ? { passthrough } : {}),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Mux upload create failed", res.status, text);
    return new Response(text, { status: 500 });
  }

  const { data } = await res.json();
  return new Response(
    JSON.stringify({ uploadUrl: data.url, uploadId: data.id }),
    { headers: { "Content-Type": "application/json" } },
  );
});
