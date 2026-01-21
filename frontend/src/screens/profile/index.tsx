import { Alert, ScrollView, View } from "react-native";
import ProfileNavBar from "../../components/profile/navBar";
import ProfileHeader from "../../components/profile/header";
import ProfilePostList from "../../components/profile/postList";
import { useState, useContext, useEffect } from "react";
import { FeedStackParamList } from "../../navigation/feed/types";
import { CurrentUserProfileItemInViewContext } from "../../navigation/feed/context";
import { useUser } from "../../hooks/useUser";
import { getPostsByUserId } from "../../services/posts";
import { Post } from "../../../types";
import { RouteProp, useIsFocused, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import Screen from "../../components/layout/Screen";
import { useTheme } from "../../theme/useTheme";
import ProfileMenuSheet from "../../components/profile/ProfileMenuSheet";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../../supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { getScheduledPosts } from "../../services/scheduledPosts";
import { keys } from "../../hooks/queryKeys";
import AppText from "../../components/ui/AppText";

type ProfileScreenRouteProp =
  | RouteProp<RootStackParamList, "profileOther">
  | RouteProp<HomeStackParamList, "Me">
  | RouteProp<FeedStackParamList, "feedProfile">;

export default function ProfileScreen({
  route,
}: {
  route: ProfileScreenRouteProp;
}) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { initialUserId } = route.params;
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const isFocused = useIsFocused();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );

  const providerUserId = useContext(CurrentUserProfileItemInViewContext);

  const userQuery = useUser(
    initialUserId ? initialUserId : providerUserId.currentUserProfileItemInView,
  );

  const user = userQuery.data;
  const isSelf = !!currentUserId && user?.uid === currentUserId;

  const { data: scheduledPosts = [], isLoading: scheduledLoading } = useQuery({
    queryKey: keys.scheduledPosts(currentUserId ?? ""),
    queryFn: () => getScheduledPosts(currentUserId ?? ""),
    enabled: isSelf,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    getPostsByUserId(user?.uid).then((posts) => setUserPosts(posts));
  }, [user]);

  useEffect(() => {
    if (!user || !isFocused) {
      return;
    }
    getPostsByUserId(user.uid).then((posts) => setUserPosts(posts));
  }, [isFocused, user]);

  useEffect(() => {
    if (!user || !isFocused) {
      return;
    }
    const hasPendingVideo = userPosts.some(
      (post) => post.media_type === "video" && !post.mux_playback_id,
    );
    if (!hasPendingVideo) {
      return;
    }

    const interval = setInterval(() => {
      getPostsByUserId(user.uid).then((posts) => setUserPosts(posts));
    }, 8000);

    return () => clearInterval(interval);
  }, [isFocused, user, userPosts]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
    }
  };

  return (
    <Screen padding={false} safeAreaEdges={["bottom"]}>
      <ProfileNavBar user={user} onMenuPress={() => setMenuOpen(true)} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader user={user} />
        {isSelf ? (
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.md,
            }}
          >
            <AppText variant="subtitle">Scheduled</AppText>
            {scheduledLoading ? (
              <AppText
                variant="muted"
                style={{ marginTop: theme.spacing.xs }}
              >
                Loading scheduled posts...
              </AppText>
            ) : scheduledPosts.length === 0 ? (
              <AppText
                variant="muted"
                style={{ marginTop: theme.spacing.xs }}
              >
                No scheduled posts.
              </AppText>
            ) : (
              <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
                {scheduledPosts.map((post) => {
                  const description =
                    typeof post.payload?.description === "string"
                      ? post.payload.description
                      : "";
                  const runAtLabel = new Date(post.run_at).toLocaleString();
                  const statusLabel =
                    post.status.charAt(0).toUpperCase() + post.status.slice(1);

                  return (
                    <View
                      key={post.id}
                      style={{
                        backgroundColor: theme.colors.surface2,
                        padding: theme.spacing.md,
                        borderRadius: theme.radius.md,
                      }}
                    >
                      <AppText
                        variant="caption"
                        style={{ color: theme.colors.textMuted }}
                      >
                        {statusLabel} · {runAtLabel}
                      </AppText>
                      <AppText variant="body" numberOfLines={2}>
                        {description || "No description"}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <ProfilePostList posts={userPosts} />
        </View>
      </ScrollView>
      <ProfileMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { label: "Settings and privacy", icon: "settings", route: "settings" },
          { label: "Saved", icon: "bookmark", route: "Saved" },
          { label: "QR code", icon: "grid", route: "ProfileQr" },
          { label: "Activity center", icon: "activity", route: "ActivityCenter" },
          { label: "Logout", icon: "log-out", onPress: handleLogout },
        ]}
        onSelect={(routeName) =>
          navigation.navigate(routeName as keyof RootStackParamList)
        }
      />
    </Screen>
  );
}
