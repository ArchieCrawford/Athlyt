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
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const json = await res.json();
  return json.data[0].embedding;
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

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: authData, error: authError } =
    await authClient.auth.getUser();
  if (authError || !authData?.user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  let body: { q?: string; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const q = String(body.q ?? "").trim();
  const limit = Math.max(5, Math.min(50, Number(body.limit ?? 20)));

  if (!q) {
    return new Response(JSON.stringify({ posts: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let embedding: number[];
  try {
    embedding = await embedText(q);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Embedding failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await adminClient.rpc("match_posts_by_embedding", {
    query_embedding: embedding,
    match_count: limit,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ posts: (data ?? []).map((x: any) => x.post_id) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
