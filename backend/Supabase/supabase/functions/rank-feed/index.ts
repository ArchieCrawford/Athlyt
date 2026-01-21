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

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error(
    "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const hoursSince = (ts: string) => {
  const t = new Date(ts).getTime();
  return (Date.now() - t) / 36e5;
};

const freshnessBoost = (hours: number) => {
  const halfLife = 18;
  return Math.exp(-hours / halfLife);
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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

  let body: { limit?: number; sport?: string; hashtag?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const limit = clamp(Number(body.limit ?? 30), 5, 60);
  const sport = body.sport ?? null;
  const hashtag = body.hashtag ?? null;

  let baseQuery = adminClient.from("post_metrics_7d").select("*").limit(400);

  if (sport) {
    baseQuery = baseQuery.eq("sport", sport);
  }

  if (hashtag) {
    const tag = String(hashtag).trim().toLowerCase().replace(/^#/, "");
    const { data: h } = await adminClient
      .from("hashtags")
      .select("id")
      .eq("tag", tag)
      .maybeSingle();
    if (h?.id) {
      const { data: ph } = await adminClient
        .from("post_hashtags")
        .select("post_id")
        .eq("hashtag_id", h.id)
        .limit(800);
      const ids = (ph ?? []).map((x) => x.post_id).filter(Boolean);
      if (ids.length === 0) {
        return new Response(JSON.stringify({ posts: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      baseQuery = baseQuery.in("post_id", ids);
    }
  }

  const { data: rows, error } = await baseQuery;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: userVec } = await adminClient
    .from("user_interest_vectors")
    .select("embedding")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  const simMap: Record<string, number> = {};
  if (userVec?.embedding) {
    const { data: sims } = await adminClient.rpc("match_posts_for_user", {
      query_embedding: userVec.embedding,
      match_count: 300,
    });
    for (const s of sims ?? []) {
      simMap[s.post_id] = 1 - Number(s.distance);
    }
  }

  const metrics = rows ?? [];
  const scored = metrics.map((row: any) => {
    const h = hoursSince(row.created_at);
    const fresh = freshnessBoost(h);
    const completion = clamp(Number(row.completion_rate_7d ?? 0), 0, 1);
    const avgWatch = Math.log1p(Number(row.avg_watch_seconds_7d ?? 0));
    const likes = Math.log1p(Number(row.likes_7d ?? 0));
    const shares = Math.log1p(Number(row.shares_7d ?? 0));
    const views = Math.log1p(Number(row.views_7d ?? 0));
    const sim = clamp(Number(simMap[row.post_id] ?? 0), 0, 1);

    const score =
      0.28 * completion +
      0.22 * avgWatch +
      0.14 * likes +
      0.12 * shares +
      0.10 * fresh +
      0.08 * sim +
      0.06 * views;

    return { post_id: row.post_id, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const explorationCount = Math.max(2, Math.floor(limit * 0.18));
  const mainCount = Math.max(0, limit - explorationCount);

  const main = scored.slice(0, Math.min(mainCount, scored.length));
  const tail = scored.slice(
    Math.min(mainCount, scored.length),
    Math.min(scored.length, mainCount + 150),
  );

  const explore = tail.sort(() => Math.random() - 0.5).slice(
    0,
    explorationCount,
  );

  const merged = [...main, ...explore]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return new Response(
    JSON.stringify({ posts: merged.map((x) => x.post_id) }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
