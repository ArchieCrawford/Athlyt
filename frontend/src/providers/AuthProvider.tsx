import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RealtimeChannel, Session } from "@supabase/supabase-js";
import { useDispatch } from "react-redux";
import { supabase } from "../../supabaseClient";
import { User } from "../../types";
import { AppDispatch } from "../redux/store";
import { setUserState } from "../redux/slices/authSlice";
import { getPostsByUser } from "../redux/slices/postSlice";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profileChannelRef = useRef<RealtimeChannel | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const clearProfileChannel = useCallback(() => {
    if (profileChannelRef.current) {
      supabase.removeChannel(profileChannelRef.current);
      profileChannelRef.current = null;
    }
  }, []);

  const applyProfile = useCallback(
    (userProfile: User | null) => {
      setProfile(userProfile);
      dispatch(setUserState({ currentUser: userProfile, loaded: true }));
    },
    [dispatch],
  );

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("uid", uid)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data as User;
  }, []);

  const createProfile = useCallback(async (authUser: Session["user"]) => {
    const displayNameFallback =
      (authUser.user_metadata?.full_name as string | undefined) ||
      authUser.email ||
      "";
    const photoURL = (authUser.user_metadata?.avatar_url as string | undefined) || null;

    const { data, error } = await supabase
      .from("user")
      .insert({
        uid: authUser.id,
        email: authUser.email,
        displayName: displayNameFallback,
        photoURL,
        followingCount: 0,
        followersCount: 0,
        likesCount: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as User;
  }, []);

  const ensureProfile = useCallback(
    async (authUser: Session["user"]): Promise<User> => {
      const existing = await fetchProfile(authUser.id);
      if (existing) return existing;
      return createProfile(authUser);
    },
    [createProfile, fetchProfile],
  );

  const subscribeToProfile = useCallback(
    (uid: string) => {
      clearProfileChannel();
      profileChannelRef.current = supabase
        .channel(`user-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user", filter: `uid=eq.${uid}` },
          (payload) => {
            const updatedUser = payload.new as User;
            applyProfile(updatedUser);
          },
        )
        .subscribe();
    },
    [applyProfile, clearProfileChannel],
  );

  const hydrateFromSession = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);

      if (!nextSession?.user) {
        clearProfileChannel();
        applyProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const ensuredProfile = await ensureProfile(nextSession.user);
        applyProfile(ensuredProfile);
        subscribeToProfile(nextSession.user.id);
        dispatch(getPostsByUser(nextSession.user.id));
      } catch (error) {
        console.error("Failed to hydrate auth session", error);
      } finally {
        setLoading(false);
      }
    },
    [applyProfile, clearProfileChannel, dispatch, ensureProfile, subscribeToProfile],
  );

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (isMounted) {
          hydrateFromSession(data.session ?? null);
        }
      })
      .catch((error) => {
        console.error("Failed to get Supabase session", error);
        setLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        hydrateFromSession(newSession);
      },
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      clearProfileChannel();
    };
  }, [clearProfileChannel, hydrateFromSession]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    try {
      const latestProfile = await ensureProfile(session.user);
      applyProfile(latestProfile);
    } catch (error) {
      console.error("Failed to refresh profile", error);
    }
  }, [applyProfile, ensureProfile, session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });

    if (error) throw error;

    if (user) {
      await ensureProfile(user);
    }
  }, [ensureProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    applyProfile(null);
    clearProfileChannel();
  }, [applyProfile, clearProfileChannel]);

  const value = useMemo(
    () => ({ session, profile, loading, signIn, signUp, signOut, refreshProfile }),
    [loading, profile, refreshProfile, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

export default AuthProvider;
