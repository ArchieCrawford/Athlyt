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

const averageVectors = (vectors: number[][]) => {
  const count = vectors.length;
  const dim = vectors[0]?.length ?? 0;
  const out = new Array(dim).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < dim; i += 1) {
      out[i] += vec[i];
    }
  }
  for (let i = 0; i < dim; i += 1) {
    out[i] /= count;
  }
  return out;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
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

  let body: { user_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const userId = body.user_id;
  if (!userId) {
    return new Response("Missing user_id", { status: 400, headers: corsHeaders });
  }

  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString();

  const { data: engaged } = await supabase
    .from("events")
    .select("post_id, event_type, created_at")
    .eq("user_id", userId)
    .in("event_type", ["like", "complete"])
    .gt("created_at", cutoff)
    .limit(200);

  const postIds = Array.from(
    new Set((engaged ?? []).map((row) => row.post_id).filter(Boolean)),
  );

  if (postIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: embeddings } = await supabase
    .from("post_embeddings")
    .select("post_id, embedding, model")
    .in("post_id", postIds)
    .limit(200);

  const vectors = (embeddings ?? [])
    .map((row: any) => row.embedding)
    .filter(Boolean);

  if (vectors.length < 3) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const model = embeddings?.[0]?.model ?? "text-embedding-3-small";
  const embedding = averageVectors(vectors);

  const { error } = await supabase.from("user_interest_vectors").upsert({
    user_id: userId,
    model,
    embedding,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ ok: true, count: vectors.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
