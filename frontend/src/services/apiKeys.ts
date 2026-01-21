import { supabase } from "../../supabaseClient";
import { ApiKey } from "../../types";

export const listApiKeys = async (ownerId?: string): Promise<ApiKey[]> => {
  if (!ownerId) {
    return [];
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, label, created_at, last_used_at, revoked_at")
    .eq("owner", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ApiKey[];
};

export const createApiKey = async (label?: string) => {
  const { data, error } = await supabase.functions.invoke("create-api-key", {
    body: { label },
  });

  if (error) {
    throw error;
  }

  if (!data?.key || !data?.api_key) {
    throw new Error("API key not returned");
  }

  return { key: data.key as string, apiKey: data.api_key as ApiKey };
};

export const revokeApiKey = async (apiKeyId: string) => {
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", apiKeyId);

  if (error) {
    throw error;
  }
};
