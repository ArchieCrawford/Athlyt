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
import { keys } from "../../hooks/queryKeys";
import AppText from "../../components/ui/AppText";
import { useQueryClient } from "@tanstack/react-query";
import { getBlockedUserIds, blockUser, unblockUser } from "../../services/blocks";
import ReportSheet from "../../components/report/ReportSheet";
import Button from "../../components/ui/Button";

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
  const [reportOpen, setReportOpen] = useState(false);
  const isFocused = useIsFocused();
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const queryClient = useQueryClient();

  const providerUserId = useContext(CurrentUserProfileItemInViewContext);

  const userQuery = useUser(
    initialUserId ? initialUserId : providerUserId.currentUserProfileItemInView,
  );

  const user = userQuery.data;
  const isSelf = !!currentUserId && user?.uid === currentUserId;

  const { data: blockedUserIds = [] } = useQuery({
    queryKey: keys.blockedUsers(currentUserId ?? ""),
    queryFn: () => getBlockedUserIds(currentUserId ?? undefined),
    enabled: !!currentUserId,
  });

  const isBlocked = !isSelf && !!user?.uid && blockedUserIds.includes(user.uid);

  useEffect(() => {
    if (!userQuery.isLoading) {
      setProfileTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setProfileTimedOut(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [userQuery.isLoading]);

  useEffect(() => {
    if (!user || isBlocked) {
      return;
    }

    getPostsByUserId(user?.uid).then((posts) => setUserPosts(posts));
  }, [isBlocked, user]);

  useEffect(() => {
    if (!user || !isFocused || isBlocked) {
      return;
    }
    getPostsByUserId(user.uid).then((posts) => setUserPosts(posts));
  }, [isBlocked, isFocused, user]);

  useEffect(() => {
    if (!user || !isFocused || isBlocked) {
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
  }, [isBlocked, isFocused, user, userPosts]);

  if (userQuery.isLoading) {
    return (
      <Screen padding={false} safeAreaEdges={["bottom"]}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
          }}
        >
          <AppText variant="subtitle">
            {profileTimedOut ? "Profile is taking a while" : "Loading profile"}
          </AppText>
          <AppText variant="muted" style={{ textAlign: "center" }}>
            {profileTimedOut
              ? "Check your connection and try again."
              : "Hang tight while we load this profile."}
          </AppText>
          {profileTimedOut ? (
            <Button
              title="Retry"
              variant="secondary"
              fullWidth={false}
              onPress={() => userQuery.refetch()}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <Screen padding={false} safeAreaEdges={["bottom"]}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: theme.spacing.lg,
            gap: theme.spacing.sm,
          }}
        >
          <AppText variant="subtitle">Profile unavailable</AppText>
          <AppText variant="muted" style={{ textAlign: "center" }}>
            Please try again later.
          </AppText>
          <Button
            title="Retry"
            variant="secondary"
            fullWidth={false}
            onPress={() => userQuery.refetch()}
          />
        </View>
      </Screen>
    );
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
    }
  };

  const handleBlockToggle = async () => {
    if (!user?.uid) {
      return;
    }
    try {
      if (isBlocked) {
        await unblockUser(user.uid);
      } else {
        await blockUser(user.uid);
      }
      queryClient.invalidateQueries({
        queryKey: keys.blockedUsers(currentUserId ?? ""),
      });
    } catch (error) {
      console.error("Failed to update block state", error);
      Alert.alert("Action failed", "Please try again.");
    }
  };

  return (
    <Screen padding={false} safeAreaEdges={["bottom"]}>
      <ProfileNavBar user={user} onMenuPress={() => setMenuOpen(true)} />
      {isBlocked ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <AppText variant="subtitle">You blocked this user.</AppText>
          <AppText
            variant="muted"
            style={{ textAlign: "center" }}
          >
            Unblock them to see their profile and posts.
          </AppText>
          <Button
            title="Unblock user"
            variant="secondary"
            fullWidth={false}
            onPress={handleBlockToggle}
          />
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader user={user} />
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <ProfilePostList posts={userPosts} />
        </View>
      </ScrollView>
      )}
      <ProfileMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={
          isSelf
            ? [
                {
                  label: "Settings and privacy",
                  icon: "settings",
                  route: "settings",
                },
                { label: "Saved", icon: "bookmark", route: "Saved" },
                {
                  label: "Legal",
                  icon: "file-text",
                  onPress: () =>
                    navigation.navigate("settings", { screen: "Legal" }),
                },
                { label: "QR code", icon: "grid", route: "ProfileQr" },
                {
                  label: "Activity center",
                  icon: "activity",
                  route: "ActivityCenter",
                },
                { label: "Logout", icon: "log-out", onPress: handleLogout },
              ]
            : [
                {
                  label: "Report user",
                  icon: "alert-triangle",
                  onPress: () => setReportOpen(true),
                },
                {
                  label: isBlocked ? "Unblock user" : "Block user",
                  icon: isBlocked ? "unlock" : "slash",
                  onPress: handleBlockToggle,
                },
              ]
        }
        onSelect={(routeName) =>
          navigation.navigate(routeName as keyof RootStackParamList)
        }
      />
      <ReportSheet
        visible={reportOpen}
        targetType="user"
        targetId={user.uid}
        title="Report user"
        onClose={() => setReportOpen(false)}
      />
    </Screen>
  );
}
