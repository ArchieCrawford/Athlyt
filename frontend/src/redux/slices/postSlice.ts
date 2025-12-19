import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import uuid from "uuid-random";
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
    }: {
      description: string;
      video: string;
      thumbnail: string;
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
      const [videoDownloadUrl, thumbnailDownloadUrl] = await Promise.all([
        saveMediaToStorage(
          video,
          `post/${user.id}/${storagePostId}/video.mp4`,
        ),
        saveMediaToStorage(
          thumbnail,
          `post/${user.id}/${storagePostId}/thumbnail.jpg`,
        ),
      ]);

      const { error: insertError } = await supabase.from("post").insert({
        creator: user.id,
        media: [videoDownloadUrl, thumbnailDownloadUrl],
        description,
        likesCount: 0,
        commentsCount: 0,
        creation: new Date().toISOString(),
      });

      if (insertError) {
        throw insertError;
      }
    } catch (error) {
      console.error("Error creating post: ", error);
      return rejectWithValue(error);
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
