import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../../supabaseClient";
import { getPostsByUser } from "./postSlice";
import { User } from "../../../types";

let profileChannel: RealtimeChannel | null = null;

const subscribeToProfile = (uid: string, dispatch: any) => {
  if (profileChannel) {
    supabase.removeChannel(profileChannel);
  }

  profileChannel = supabase
    .channel(`user-${uid}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user", filter: `uid=eq.${uid}` },
      (payload) => {
        const updatedUser = payload.new as User;
        dispatch(setUserState({ currentUser: updatedUser, loaded: true }));
      },
    )
    .subscribe();
};

const fetchProfile = async (uid: string) => {
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("uid", uid)
    .single();

  if (error) throw error;
  return data as User;
};

export const userAuthStateListener = createAsyncThunk(
  "auth/userAuthStateListener",
  async (_, { dispatch }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionUser = session?.user;

    if (sessionUser) {
      dispatch(getCurrentUserData());
      dispatch(getPostsByUser(sessionUser.id));
    } else {
      dispatch(setUserState({ currentUser: null, loaded: true }));
    }

    supabase.auth.onAuthStateChange((_event, newSession) => {
      const authUser = newSession?.user;
      if (authUser) {
        dispatch(getCurrentUserData());
        dispatch(getPostsByUser(authUser.id));
      } else {
        dispatch(setUserState({ currentUser: null, loaded: true }));
      }
    });
  },
);

export const getCurrentUserData = createAsyncThunk(
  "auth/getCurrentUserData",
  async (_, { dispatch }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      dispatch(setUserState({ currentUser: null, loaded: true }));
      return;
    }

    const profile = await fetchProfile(user.id);
    dispatch(setUserState({ currentUser: profile, loaded: true }));
    subscribeToProfile(user.id, dispatch);
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string }) => {
    const { email, password } = payload;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: { email: string; password: string }) => {
    const { email, password } = payload;
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (user) {
      await supabase.from("user").insert({
        uid: user.id,
        email,
        displayName: user.email,
        photoURL: user.user_metadata?.avatar_url || null,
        followingCount: 0,
        followersCount: 0,
        likesCount: 0,
      });
    }
  },
);

interface AuthState {
  currentUser: User | null;
  loaded: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  loaded: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserState: (state, action) => {
      state.currentUser = action.payload.currentUser;
      state.loaded = action.payload.loaded;
    },
  },
  extraReducers: (builder) => {
    // Handle additional cases for async actions if needed
  },
});

export const { setUserState } = authSlice.actions;
export default authSlice.reducer;
