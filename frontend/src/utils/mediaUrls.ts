import { resolveStorageBucketForPath, supabase } from "../../supabaseClient";

const isRemoteUri = (uri: string) => /^https?:\/\//i.test(uri);
const isLocalUri = (uri: string) => /^(file|content):\/\//i.test(uri);

export const getMediaPublicUrl = (path?: string | null) => {
  if (!path) return null;
  if (isRemoteUri(path) || isLocalUri(path)) {
    return path;
  }
  console.warn("Non-http media path passed to image; converting to public URL.", {
    path,
  });
  const bucket = resolveStorageBucketForPath(path);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
};

export const getMediaSignedUrl = async (
  path?: string | null,
  expiresIn = 3600,
) => {
  if (!path) return null;
  if (isRemoteUri(path) || isLocalUri(path)) {
    return path;
  }
  const bucket = resolveStorageBucketForPath(path);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.warn("Failed to create signed media URL", error);
    return null;
  }
  return data?.signedUrl ?? null;
};

export const getMuxThumbnail = (playbackId?: string | null) => {
  if (!playbackId) return null;
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`;
};
