import { supabase } from "../../supabaseClient";

export type TrackEventPayload = {
  postId: string;
  eventType:
    | "view"
    | "watch_time"
    | "complete"
    | "like"
    | "unlike"
    | "comment"
    | "share"
    | "follow"
    | "unfollow"
    | "hide"
    | "report";
  valueNum?: number;
  valueText?: string;
  meta?: Record<string, unknown>;
};

export const trackEvent = async (payload: TrackEventPayload) => {
  const { error } = await supabase.functions.invoke("track-event", {
    body: {
      post_id: payload.postId,
      event_type: payload.eventType,
      value_num: payload.valueNum ?? null,
      value_text: payload.valueText ?? null,
      meta: payload.meta ?? {},
    },
  });

  if (error) {
    throw error;
  }
};

export const rankFeed = async ({
  limit = 30,
  sport,
  hashtag,
}: {
  limit?: number;
  sport?: string | null;
  hashtag?: string | null;
}) => {
  const { data, error } = await supabase.functions.invoke("rank-feed", {
    body: { limit, sport, hashtag },
  });

  if (error) {
    throw error;
  }

  return (data?.posts ?? []) as string[];
};

export const semanticSearchPosts = async (query: string, limit = 20) => {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const { data, error } = await supabase.functions.invoke("semantic-search", {
    body: { q, limit },
  });

  if (error) {
    throw error;
  }

  return (data?.posts ?? []) as string[];
};
