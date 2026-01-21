import { resolveStorageBucketForPath, supabase } from "../../supabaseClient";

export const saveMediaToStorage = async (
  mediaUri: string,
  path: string,
  bucket?: string,
) => {
  const response = await fetch(mediaUri);
  const blob = await response.blob();
  const targetBucket = bucket || resolveStorageBucketForPath(path);

  const { error } = await supabase.storage
    .from(targetBucket)
    .upload(path, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: blob.type || "application/octet-stream",
    });

  if (error) {
    throw error;
  }

  return path;
};
