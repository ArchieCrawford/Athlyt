import { Dispatch, SetStateAction } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import {
  POST_COMMENTS_TABLE,
  POST_LIKES_TABLE,
  POSTS_TABLE,
} from "../constants/supabaseTables";
import { rankFeed, trackEvent } from "./algorithm";
import { Post, Comment } from "../types";

let commentChannel: RealtimeChannel | null = null;

export const ensurePosterUrlForPost = async (post: Post): Promise<Post> => {
  const media = Array.isArray(post.media) ? [...post.media] : [];
  const mediaPath = post.media_path ?? media[0];
  const thumbPath = post.thumb_path ?? post.poster_url ?? media[1];

  if (!media[0] && mediaPath) {
    media[0] = mediaPath;
  }
  if (!media[1] && thumbPath) {
    media[1] = thumbPath;
  }

  return {
    ...post,
    media,
    media_path: mediaPath ?? null,
    thumb_path: thumbPath ?? null,
    poster_url: post.poster_url ?? thumbPath ?? null,
  };
};

const normalizePostRow = (item: any): Post => {
  const media = Array.isArray(item?.media) ? item.media : [];
  const mediaPath = item?.media_path ?? item?.media_url ?? media[0] ?? null;
  const posterUrl =
    item?.poster_url ?? item?.thumbnail_url ?? item?.thumb_url ?? null;
  const thumbPath =
    item?.thumb_path ?? posterUrl ?? media[1] ?? item?.thumbnail_url ?? null;

  return {
    id: item.id,
    creator: item.creator ?? item.user_id ?? item.owner ?? "",
    media,
    media_path: mediaPath,
    thumb_path: thumbPath,
    media_type: item.media_type ?? item.mediaType ?? "image",
    mux_playback_id: item.mux_playback_id ?? item.muxPlaybackId ?? null,
    poster_url: posterUrl ?? thumbPath ?? null,
    description: item.description ?? item.caption ?? "",
    sport: item.sport ?? null,
    team: item.team ?? null,
    likesCount: Number(item.likesCount ?? item.likes_count ?? 0),
    commentsCount: Number(item.commentsCount ?? item.comments_count ?? 0),
    creation:
      item.creation ??
      item.created_at ??
      item.createdAt ??
      new Date().toISOString(),
  } as Post;
};

/**
 * Returns all the posts in the database.
 *
 * @returns {Promise<[<Post>]>} post list if successful.
 */

export const getFeed = async ({
  excludeCreatorIds = [],
}: { excludeCreatorIds?: string[] } = {}): Promise<Post[]> => {
  const excludeSet = excludeCreatorIds.length
    ? new Set(excludeCreatorIds)
    : null;
  try {
    const rankedIds = await rankFeed({ limit: 40 });
    if (rankedIds.length > 0) {
      let request = supabase.from(POSTS_TABLE).select("*").in("id", rankedIds);
      if (excludeCreatorIds.length > 0) {
        const excludeList = excludeCreatorIds.map((id) => `"${id}"`).join(",");
        request = request.not("creator", "in", `(${excludeList})`);
      }
      const { data, error } = await request;

      if (!error) {
        const orderMap = new Map(
          rankedIds.map((id, index) => [id, index]),
        );
        const ordered = (data || []).sort(
          (a, b) =>
            (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
        );

        const filtered = excludeSet
          ? ordered.filter((item) => !excludeSet.has(item.creator))
          : ordered;

        return await Promise.all(
          filtered.map(async (item) =>
            ensurePosterUrlForPost(normalizePostRow(item)),
          ),
        );
      }
    }
  } catch (error) {
    console.warn("Ranked feed unavailable, falling back.", error);
  }

  let request = supabase
    .from(POSTS_TABLE)
    .select("*")
    .order("creation", { ascending: false });

  if (excludeCreatorIds.length > 0) {
    const excludeList = excludeCreatorIds.map((id) => `"${id}"`).join(",");
    request = request.not("creator", "in", `(${excludeList})`);
  }

  const { data, error } = await request;

  if (error) {
    console.error("Failed to get feed: ", error);
    throw error;
  }

  const filtered = excludeSet
    ? (data || []).filter((item) => !excludeSet.has(item.creator))
    : data || [];

  return await Promise.all(
    filtered.map(async (item) => ensurePosterUrlForPost(normalizePostRow(item))),
  );
};

export const getRecentPosts = async ({
  limit = 12,
  excludeUserId,
  excludeUserIds = [],
}: {
  limit?: number;
  excludeUserId?: string;
  excludeUserIds?: string[];
}): Promise<Post[]> => {
  const excluded = [
    ...(excludeUserId ? [excludeUserId] : []),
    ...excludeUserIds,
  ];

  let request = supabase
    .from(POSTS_TABLE)
    .select("*")
    .order("creation", { ascending: false })
    .limit(limit);

  if (excluded.length > 0) {
    const excludeList = excluded.map((id) => `"${id}"`).join(",");
    request = request.not("creator", "in", `(${excludeList})`);
  }

  const { data, error } = await request;

  if (error) {
    console.error("Failed to get recent posts: ", error);
    throw error;
  }

  const posts = await Promise.all(
    (data || []).map(async (item) =>
      ensurePosterUrlForPost(normalizePostRow(item)),
    ),
  );

  return posts;
};

export const getPostsByCreators = async (
  creatorIds: string[],
): Promise<Post[]> => {
  if (!creatorIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .select("*")
    .in("creator", creatorIds)
    .order("creation", { ascending: false });

  if (error) {
    console.error("Failed to get filtered feed: ", error);
    throw error;
  }

  const posts = await Promise.all(
    (data || []).map(async (item) =>
      ensurePosterUrlForPost(normalizePostRow(item)),
    ),
  );

  return posts;
};

export const queryPostsByDescription = async (query: string): Promise<Post[]> => {
  if (!query) {
    return [];
  }
  const { data, error } = await supabase
    .from(POSTS_TABLE)
    .select("*")
    .ilike("description", `%${query}%`)
    .order("creation", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to query posts: ", error);
    throw error;
  }

  const posts = await Promise.all(
    (data || []).map(async (item) =>
      ensurePosterUrlForPost(normalizePostRow(item)),
    ),
  );

  return posts;
};

/**
 * Gets the like state of a user in a specific post
 * @param {String} postId - id of the post
 * @param {String} uid - id of the user to get the like state of.
 *
 * @returns {Promise<Boolean>} true if user likes it and vice versa.
 */
export const getLikeById = async (postId: string, uid: string) => {
  try {
    const { data, error } = await supabase
      .from(POST_LIKES_TABLE)
      .select("user_id")
      .eq("post_id", postId)
      .eq("user_id", uid);

    if (error) {
      throw error;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    throw new Error("Could not get like");
  }
};

/**
 * Updates the like of a post according to the current user's id
 * @param {String} postId - id of the post
 * @param {String} uid - id of the user to get the like state of.
 * @param {Boolean} currentLikeState - true if the user likes the post and vice versa.
 */
export const updateLike = async (
  postId: string,
  uid: string,
  currentLikeState: boolean,
) => {
  try {
    if (currentLikeState) {
      const { error } = await supabase
        .from(POST_LIKES_TABLE)
        .delete()
        .eq("post_id", postId)
        .eq("user_id", uid);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from(POST_LIKES_TABLE)
        .upsert({ post_id: postId, user_id: uid });

      if (error) throw error;
    }
    const eventType = currentLikeState ? "unlike" : "like";
    void trackEvent({ postId, eventType }).catch(() => {});
  } catch (error) {
    throw new Error("Could not update like");
  }
};

export const addComment = async (
  postId: string,
  creator: string,
  comment: string,
) => {
  try {
    const { error } = await supabase.from(POST_COMMENTS_TABLE).insert({
      post_id: postId,
      creator,
      comment,
      creation: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (e) {
    console.error("Error adding comment: ", e);
  }
};

export const commentListener = (
  postId: string,
  setCommentList: Dispatch<SetStateAction<Comment[]>>,
) => {
  const loadComments = async () => {
    const { data, error } = await supabase
      .from(POST_COMMENTS_TABLE)
      .select("*")
      .eq("post_id", postId)
      .order("creation", { ascending: false });

    if (error) {
      console.error("Failed to load comments", error);
      return;
    }

    const comments = (data || []).map((item) => ({
      id: item.id,
      creator: item.creator,
      comment: item.comment,
      creation: item.creation ?? item.created_at,
    })) as Comment[];

    setCommentList(comments);
  };

  loadComments();

  if (commentChannel) {
    supabase.removeChannel(commentChannel);
  }

  commentChannel = supabase
    .channel(`post-comments-${postId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: POST_COMMENTS_TABLE,
        filter: `post_id=eq.${postId}`,
      },
      () => {
        loadComments();
      },
    )
    .subscribe();

  return () => {
    if (commentChannel) {
      supabase.removeChannel(commentChannel);
      commentChannel = null;
    }
  };
};

export const clearCommentListener = () => {
  if (commentChannel) {
    supabase.removeChannel(commentChannel);
    commentChannel = null;
  }
};

export const getPostsByUserId = (
  uid: string | null,
): Promise<Post[]> => {
  return new Promise((resolve, reject) => {
    if (!uid) {
      reject(new Error("User ID is not set"));
      return;
    }

    const loadPosts = async () => {
        const { data, error } = await supabase
          .from(POSTS_TABLE)
          .select("*")
          .eq("creator", uid)
          .order("creation", { ascending: false });

      if (error) {
        reject(error);
        return;
      }

      const posts = await Promise.all(
        (data || []).map(async (item) =>
          ensurePosterUrlForPost(normalizePostRow(item)),
        ),
      );

      resolve(posts);
    };

    loadPosts();
  });
};
