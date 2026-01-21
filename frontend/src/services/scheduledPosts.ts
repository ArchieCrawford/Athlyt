import { supabase } from "../../supabaseClient";
import { ScheduledPost } from "../../types";

export const getScheduledPosts = async (
  ownerId: string,
  limit = 20,
): Promise<ScheduledPost[]> => {
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select(
      "id, owner, run_at, payload, status, posted_post_id, last_error, created_at",
    )
    .eq("owner", ownerId)
    .order("run_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as ScheduledPost[];
};
