import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const openaiKey = Deno.env.get("OPENAI_API_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error(
    "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY",
  );
}

if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY");
}

const hashString = (value: string) => {
  const data = new TextEncoder().encode(value);
  let hash = 2166136261;
  for (const byte of data) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return String(hash >>> 0);
};

const embedText = async (text: string) => {
  if (!openaiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const json = await res.json();
  return { model: "text-embedding-3-small", embedding: json.data[0].embedding };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const isService = authHeader === `Bearer ${supabaseServiceKey}`;
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;
  if (!isService) {
    const { data: authData, error: authError } =
      await authClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    userId = authData.user.id;
  }

  let body: { post_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const postId = body.post_id;
  if (!postId) {
    return new Response("Missing post_id", {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { data: post, error: postError } = await adminClient
    .from("post")
    .select("id, creator, description, sport, team")
    .eq("id", postId)
    .maybeSingle();

  if (postError || !post) {
    return new Response(
      JSON.stringify({ error: postError?.message ?? "Post not found" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!isService && userId && post.creator !== userId) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  await adminClient.rpc("upsert_post_hashtags", {
    p_post_id: post.id,
    p_caption: post.description ?? "",
    p_sport: post.sport ?? null,
    p_team: post.team ?? null,
  });

  const text = [
    `caption: ${post.description ?? ""}`,
    `sport: ${post.sport ?? ""}`,
    `team: ${post.team ?? ""}`,
  ].join("\n");

  const contentHash = hashString(text);

  const { data: existing } = await adminClient
    .from("post_embeddings")
    .select("content_hash")
    .eq("post_id", post.id)
    .maybeSingle();

  if (existing?.content_hash === contentHash) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let embeddingPayload: { model: string; embedding: number[] };
  try {
    embeddingPayload = await embedText(text);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Embedding failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error } = await adminClient.from("post_embeddings").upsert({
    post_id: post.id,
    model: embeddingPayload.model,
    content_hash: contentHash,
    embedding: embeddingPayload.embedding,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
