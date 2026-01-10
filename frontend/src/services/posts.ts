import { Dispatch, SetStateAction } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import { Post, Comment } from "../types";

let commentChannel: RealtimeChannel | null = null;

export const ensurePosterUrlForPost = async (post: Post): Promise<Post> => {
  const media = Array.isArray(post.media) ? [...post.media] : [];
  const firstMedia = media[0] ?? "";
  const isVideo = Boolean(
    post.media_type === "video" ||
      post.mux_playback_id ||
      /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(firstMedia),
  );
  let posterUrl = post.poster_url ?? media[1];

  if (!posterUrl && post.media_type === "video" && post.mux_playback_id) {
    posterUrl = `https://image.mux.com/${post.mux_playback_id}/thumbnail.jpg`;
  }

  if (!posterUrl && !isVideo) {
    posterUrl = media[0];
  }

  if (posterUrl && !media[1]) {
    media[1] = posterUrl;
  }

  if (posterUrl && post.poster_url !== posterUrl && post.id) {
    supabase.from("post").update({ poster_url: posterUrl }).eq("id", post.id);
  }

  return { ...post, poster_url: posterUrl, media };
};

/**
 * Returns all the posts in the database.
 *
 * @returns {Promise<[<Post>]>} post list if successful.
 */

export const getFeed = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from("post")
    .select("*")
    .order("creation", { ascending: false });

  if (error) {
    console.error("Failed to get feed: ", error);
    throw error;
  }

  const posts = await Promise.all(
    (data || []).map(async (item) =>
      ensurePosterUrlForPost({
        id: item.id,
        ...item,
        creation: item.creation ?? item.created_at,
      } as Post),
    ),
  );

  return posts;
};

export const queryPostsByDescription = async (query: string): Promise<Post[]> => {
  if (!query) {
    return [];
  }
  const { data, error } = await supabase
    .from("post")
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
      ensurePosterUrlForPost({
        id: item.id,
        ...item,
        creation: item.creation ?? item.created_at,
      } as Post),
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
      .from("post_likes")
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
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", uid);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("post_likes")
        .upsert({ post_id: postId, user_id: uid });

      if (error) throw error;
    }
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
    const { error } = await supabase.from("post_comments").insert({
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
      .from("post_comments")
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
        table: "post_comments",
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
          .from("post")
          .select("*")
          .eq("creator", uid)
          .order("creation", { ascending: false });

      if (error) {
        reject(error);
        return;
      }

      const posts = await Promise.all(
        (data || []).map(async (item) =>
          ensurePosterUrlForPost({
            id: item.id,
            ...item,
            creation: item.creation ?? item.created_at,
          } as Post),
        ),
      );

      resolve(posts);
    };

    loadPosts();
  });
};
