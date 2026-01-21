import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env."
  );
}

const storageBucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim();
const profileBucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET_PROFILE?.trim();
const postsBucket = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET_POSTS?.trim();

export const SUPABASE_STORAGE_BUCKET = storageBucket || "Athlyt";
export const SUPABASE_STORAGE_BUCKET_PROFILE =
  profileBucket || SUPABASE_STORAGE_BUCKET;
export const SUPABASE_STORAGE_BUCKET_POSTS =
  postsBucket || SUPABASE_STORAGE_BUCKET;

export const resolveStorageBucketForPath = (path?: string | null) => {
  if (!path) {
    return SUPABASE_STORAGE_BUCKET;
  }

  if (path.startsWith("profileImage/") || path.startsWith("avatars/")) {
    return SUPABASE_STORAGE_BUCKET_PROFILE;
  }

  if (path.startsWith("posts/") || path.startsWith("postThumbs/")) {
    return SUPABASE_STORAGE_BUCKET_POSTS;
  }

  return SUPABASE_STORAGE_BUCKET;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
