import { supabase, SUPABASE_STORAGE_BUCKET } from "../../supabaseClient";

export const saveMediaToStorage = async (mediaUri: string, path: string) => {
  const response = await fetch(mediaUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(path, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: blob.type || "application/octet-stream",
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
};
