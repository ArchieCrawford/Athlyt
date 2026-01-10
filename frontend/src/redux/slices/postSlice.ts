import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import uuid from "uuid-random";
import * as VideoThumbnails from "expo-video-thumbnails";
import { supabase } from "../../../supabaseClient";
import { saveMediaToStorage } from "../../services/utils";
import { Post } from "../../../types";

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

    try {
      const storagePostId = uuid();
      let media: string[] = [];
      let posterUrl: string | null = null;

      if (mediaType === "image") {
        const imageDownloadUrl = await saveMediaToStorage(
          video,
          `post/${user.id}/${storagePostId}/image.jpg`,
        );
        posterUrl = imageDownloadUrl;
        media = [imageDownloadUrl, imageDownloadUrl];
      } else {
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

        const videoDownloadUrl = await saveMediaToStorage(
          video,
          `post/${user.id}/${storagePostId}/video.mp4`,
        );

        if (thumbnailUri) {
          posterUrl = await saveMediaToStorage(
            thumbnailUri,
            `postThumbs/${user.id}/${storagePostId}.jpg`,
          );
          media = [videoDownloadUrl, posterUrl];
        } else {
          media = [videoDownloadUrl];
        }
      }

      const { error: insertError } = await supabase.from("post").insert({
        creator: user.id,
        media,
        description,
        likesCount: 0,
        commentsCount: 0,
        creation: new Date().toISOString(),
        media_type: mediaType,
        poster_url: posterUrl,
      });

      if (insertError) {
        throw insertError;
      }
    } catch (error) {
      console.error("Error creating post: ", error);
      const message =
        error instanceof Error
          ? error.message
          : (error as any)?.message ?? String(error);
      return rejectWithValue(message);
    }
  },
);

export const getPostsByUser = createAsyncThunk(
  "post/getPostsByUser",
  async (uid: string, { dispatch, rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("post")
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
