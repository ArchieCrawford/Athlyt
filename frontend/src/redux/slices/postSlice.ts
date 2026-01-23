import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import uuid from "uuid-random";
import * as VideoThumbnails from "expo-video-thumbnails";
import { supabase } from "../../../supabaseClient";
import { saveMediaToStorage } from "../../services/utils";
import { logEvent } from "../../services/telemetry";
import { Post } from "../../../types";
import { POSTS_TABLE } from "../../constants/supabaseTables";

interface PostState {
  loading: boolean;
  error: string | null;
  currentUserPosts: Post[] | null;
}

const initialState: PostState = {
  loading: false,
  error: null,
  currentUserPosts: null,
};

export const createPost = createAsyncThunk(
  "post/create",
  async (
    {
      description,
      video,
      thumbnail,
      mediaType = "video",
    }: {
      description: string;
      video: string;
      thumbnail?: string;
      mediaType?: "video" | "image";
    },
    { rejectWithValue },
  ) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return rejectWithValue(new Error("User not authenticated"));
    }

    const postId = uuid();
    const createdAt = new Date().toISOString();

    try {
      if (mediaType === "image") {
        let media: string[] = [];
        let thumbPath: string | null = null;
        const mediaPath = `posts/${user.id}/${postId}.jpg`;
        await saveMediaToStorage(video, mediaPath);
        thumbPath = mediaPath;
        media = [mediaPath, thumbPath];
        const { error: insertError } = await supabase.from(POSTS_TABLE).insert({
          id: postId,
          creator: user.id,
          media,
          media_path: mediaPath,
          thumb_path: thumbPath,
          description,
          likesCount: 0,
          commentsCount: 0,
          creation: createdAt,
          media_type: "image",
          poster_url: thumbPath,
        });

        if (insertError) {
          throw insertError;
        }

        return;
      }

      let thumbnailUri = thumbnail;
      if (!thumbnailUri) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(video, {
            time: 1000,
          });
          thumbnailUri = uri;
        } catch (error) {
          console.warn("Thumbnail generation failed:", error);
        }
      }

      let thumbPath: string | null = null;
      if (thumbnailUri) {
        thumbPath = `postThumbs/${user.id}/${postId}.jpg`;
        await saveMediaToStorage(thumbnailUri, thumbPath);
      }

      const { error: insertError } = await supabase.from(POSTS_TABLE).insert({
        id: postId,
        creator: user.id,
        media: [],
        media_path: null,
        thumb_path: thumbPath,
        description,
        likesCount: 0,
        commentsCount: 0,
        creation: createdAt,
        media_type: "video",
        poster_url: thumbPath,
      });

      if (insertError) {
        throw insertError;
      }

      void logEvent("mux_upload_start", { postId });

      const { data: muxData, error: muxError } =
        await supabase.functions.invoke("mux-create-upload", {
          body: { postId },
        });

      if (muxError) {
        throw muxError;
      }

      const uploadUrl = muxData?.uploadUrl as string | undefined;
      const uploadId = muxData?.uploadId as string | undefined;

      if (!uploadUrl || !uploadId) {
        throw new Error("Mux upload URL not available");
      }

      const { error: updateError } = await supabase
        .from(POSTS_TABLE)
        .update({ mux_upload_id: uploadId })
        .eq("id", postId);

      if (updateError) {
        throw updateError;
      }

      const uploadResponse = await fetch(video);
      const uploadBlob = await uploadResponse.blob();

      const muxUploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadBlob,
        headers: {
          "Content-Type": uploadBlob.type || "application/octet-stream",
        },
      });

      if (!muxUploadResponse.ok) {
        const errorText = await muxUploadResponse.text();
        throw new Error(
          `Mux upload failed: ${muxUploadResponse.status} ${errorText}`,
        );
      }

      void logEvent("mux_upload_complete", { postId, uploadId });
    } catch (error) {
      console.error("Error creating post: ", error);
      const message =
        error instanceof Error
          ? error.message
          : (error as any)?.message ?? String(error);
      if (mediaType === "video") {
        void logEvent("mux_upload_failed", { postId, error: message });
      }
      return rejectWithValue(message);
    }
  },
);

export const getPostsByUser = createAsyncThunk(
  "post/getPostsByUser",
  async (uid: string, { dispatch, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from(POSTS_TABLE)
        .select("*")
        .eq("creator", uid)
        .order("creation", { ascending: false });

      if (error) {
        throw error;
      }

      const posts = (data || []).map((item) => ({
        id: item.id,
        ...item,
        creation: item.creation ?? (item as any).created_at,
      })) as Post[];

      dispatch({ type: "CURRENT_USER_POSTS_UPDATE", payload: posts });

      return posts; // Return posts as fulfilled payload
    } catch (error) {
      console.error("Failed to get posts: ", error);
      return rejectWithValue(error);
    }
  },
);

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    // Add synchronous reducers here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || null;
      })
      .addCase(getPostsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getPostsByUser.fulfilled,
        (state, action: PayloadAction<Post[]>) => {
          state.loading = false;
          state.currentUserPosts = action.payload;
        },
      )
      .addCase(getPostsByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || null;
      });
  },
});

export default postSlice.reducer;
