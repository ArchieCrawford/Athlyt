import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } =
    await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  let payload: { label?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const label =
    typeof payload.label === "string" && payload.label.trim().length > 0
      ? payload.label.trim()
      : null;

  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  const apiKey = toBase64Url(keyBytes);
  const keyHash = await sha256Hex(apiKey);

  const { data: apiKeyRow, error: insertError } = await supabase
    .from("api_keys")
    .insert({
      owner: authData.user.id,
      label,
      key_hash: keyHash,
    })
    .select("id, label, created_at, last_used_at, revoked_at")
    .single();

  if (insertError) {
    console.error("Failed to insert api key", insertError);
    return new Response("Failed to create key", {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({ key: apiKey, api_key: apiKeyRow }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
