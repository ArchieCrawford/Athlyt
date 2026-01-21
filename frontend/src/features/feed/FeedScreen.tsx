import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { RouteProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { FeedStackParamList } from "../../navigation/feed/types";
import { CurrentUserProfileItemInViewContext } from "../../navigation/feed/context";
import { getFeed, getPostsByCreators, getPostsByUserId } from "../../services/posts";
import { Post } from "../../../types";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import Screen from "../../components/layout/Screen";
import FeedItem, { FeedItemHandles } from "./FeedItem";
import FeedHeaderTabs, { FeedTabKey } from "./components/FeedHeaderTabs";
import { rankPosts } from "./ranker";
import { getFollowingIds, getFriendIds } from "../../services/user";
import { MaterialBottomTabNavigationProp } from "@react-navigation/material-bottom-tabs";
import { RootState } from "../../redux/store";
import { keys } from "../../hooks/queryKeys";
import { trackEvent } from "../../services/algorithm";
import { getBlockedUserIds } from "../../services/blocks";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FeedScreenRouteProp =
  | RouteProp<RootStackParamList, "userPosts">
  | RouteProp<HomeStackParamList, "feed">
  | RouteProp<FeedStackParamList, "feedList">;

interface PostViewToken extends ViewToken {
  item: Post;
}

export default function FeedScreen({
  route,
}: {
  route: FeedScreenRouteProp;
}) {
  const theme = useTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<MaterialBottomTabNavigationProp<HomeStackParamList>>();
  const { setCurrentUserProfileItemInView } = useContext(
    CurrentUserProfileItemInViewContext,
  );
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );

  const params = (route?.params ?? {}) as Partial<{
    creator: string;
    profile: boolean;
    tabBarHeight: number;
  }>;
  const creator = params.creator ?? "";
  const profile = params.profile ?? false;
  const safeAreaEdges = profile ? ["bottom"] : [];
  const tabBarHeight = params.tabBarHeight ?? 0;
  const baseTabBarHeight = Math.max(0, tabBarHeight - insets.bottom);

  const itemHeight = useMemo(() => {
    const computed =
      height - insets.top - insets.bottom - baseTabBarHeight;
    return Math.max(1, Math.round(computed));
  }, [baseTabBarHeight, height, insets.bottom, insets.top]);

  const listPaddingTop = insets.top;
  const listPaddingBottom = insets.bottom + baseTabBarHeight;

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [rankedPosts, setRankedPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedTabKey>("For You");
  const [muted, setMuted] = useState(false);
  const mediaRefs = useRef<Record<string, FeedItemHandles | null>>({});
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [seenLoaded, setSeenLoaded] = useState(false);
  const activePostIdRef = useRef<string | null>(null);

  const showTabs = !profile;
  const stopAllMedia = useCallback(() => {
    Object.values(mediaRefs.current).forEach((cell) => {
      cell?.stop();
    });
  }, []);

  const { data: followingIds = [] } = useQuery({
    queryKey: keys.followingIds(currentUserId ?? ""),
    queryFn: () => getFollowingIds(currentUserId ?? undefined),
    enabled: !!currentUserId && !profile,
  });

  const { data: friendIds = [] } = useQuery({
    queryKey: keys.friendIds(currentUserId ?? ""),
    queryFn: () => getFriendIds(currentUserId ?? undefined),
    enabled: !!currentUserId && !profile,
  });

  const { data: blockedUserIds = [] } = useQuery({
    queryKey: keys.blockedUsers(currentUserId ?? ""),
    queryFn: () => getBlockedUserIds(currentUserId ?? undefined),
    enabled: !!currentUserId && !profile,
  });

  useFocusEffect(
    useCallback(() => {
      if (activePostIdRef.current) {
        mediaRefs.current[activePostIdRef.current]?.play();
      }
      return () => {
        stopAllMedia();
      };
    }, [stopAllMedia]),
  );

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      let nextPosts: Post[] = [];

      if (profile && creator) {
        nextPosts = await getPostsByUserId(creator);
      } else if (activeTab === "Following") {
        const filtered = followingIds.filter(
          (id) => !blockedUserIds.includes(id),
        );
        nextPosts = await getPostsByCreators(filtered);
      } else if (activeTab === "Friends") {
        const filtered = friendIds.filter(
          (id) => !blockedUserIds.includes(id),
        );
        nextPosts = await getPostsByCreators(filtered);
      } else {
        nextPosts = await getFeed({ excludeCreatorIds: blockedUserIds });
      }

      setPosts(nextPosts);
    } catch (err) {
      console.error("Failed to load feed", err);
      setError("Unable to load posts");
      setPosts([]);
    }
  }, [activeTab, blockedUserIds, creator, friendIds, followingIds, profile]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (posts !== null) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 12000);
    return () => clearTimeout(timer);
  }, [posts]);

  useEffect(() => {
    if (profile) {
      return;
    }
    AsyncStorage.getItem("feed_seen_ids")
      .then((stored) => {
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          seenIdsRef.current = new Set(ids);
        }
      })
      .catch(() => {})
      .finally(() => setSeenLoaded(true));
  }, [profile]);

  useEffect(() => {
    if (activeTab !== "For You") {
      setRankedPosts(null);
      return;
    }
    if (!posts || !seenLoaded) {
      return;
    }
    setRankedPosts(rankPosts(posts, seenIdsRef.current));
  }, [activeTab, posts, seenLoaded]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: PostViewToken[] }) => {
      const activeItem = viewableItems.find((item) => item.isViewable);
      const activeId = activeItem?.item?.id ?? null;
      activePostIdRef.current = activeId;

      Object.entries(mediaRefs.current).forEach(([id, cell]) => {
        if (!cell) {
          return;
        }
        if (id === activeId) {
          if (!profile && setCurrentUserProfileItemInView) {
            setCurrentUserProfileItemInView(activeItem?.item.creator);
          }
          cell.play();
        } else {
          cell.stop();
        }
      });

      if (activeId && !seenIdsRef.current.has(activeId)) {
        seenIdsRef.current.add(activeId);
        void trackEvent({ postId: activeId, eventType: "view" }).catch(() => {});
        AsyncStorage.setItem(
          "feed_seen_ids",
          JSON.stringify(Array.from(seenIdsRef.current)),
        ).catch(() => {});
      }
    },
  );

  const visiblePosts = useMemo(() => {
    if (!posts) {
      return [];
    }
    if (profile) {
      return posts;
    }
    if (activeTab === "For You") {
      return rankedPosts ?? posts;
    }
    return posts;
  }, [activeTab, posts, profile, rankedPosts]);

  const emptyLabel = useMemo(() => {
    if (error) {
      return "Could not load posts";
    }
    if (profile) {
      return "No posts yet";
    }
    if (activeTab === "Following") {
      return "No posts from following";
    }
    if (activeTab === "Friends") {
      return "No friends posts yet";
    }
    return "No posts yet";
  }, [activeTab, error, profile]);

  const handleSearchPress = () => {
    const parent = navigation.getParent()?.getParent();
    if (parent) {
      parent.navigate("Discover" as never);
      return;
    }
    navigation.navigate("Discover");
  };

  return (
    <Screen
      fullBleed
      padding={false}
      safeAreaEdges={safeAreaEdges}
      style={{ backgroundColor: theme.colors.bg }}
    >
      {showTabs ? (
        <FeedHeaderTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSearchPress={handleSearchPress}
        />
      ) : null}
      <View
        style={{
          flex: 1,
          paddingTop: listPaddingTop,
          paddingBottom: listPaddingBottom,
        }}
      >
        {posts === null ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.bg,
            }}
          >
            {timedOut ? (
              <View style={{ alignItems: "center", gap: theme.spacing.sm }}>
                <AppText variant="subtitle">Feed is taking a while</AppText>
                <AppText variant="muted" style={{ textAlign: "center" }}>
                  Please check your connection and try again.
                </AppText>
                <Pressable
                  onPress={fetchPosts}
                  style={({ pressed }) => [
                    {
                      marginTop: theme.spacing.sm,
                      paddingVertical: theme.spacing.sm,
                      paddingHorizontal: theme.spacing.lg,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.surface2,
                    },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <AppText>Retry</AppText>
                </Pressable>
              </View>
            ) : (
              <ActivityIndicator size="large" color={theme.colors.accent} />
            )}
          </View>
        ) : visiblePosts.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: theme.spacing.xl,
              gap: theme.spacing.sm,
              backgroundColor: theme.colors.bg,
            }}
          >
            <AppText variant="subtitle">{emptyLabel}</AppText>
            <AppText variant="muted" style={{ textAlign: "center" }}>
              {error
                ? "Check your connection and try again."
                : profile
                ? "This athlete has not posted yet."
                : "Follow athletes and check back soon."}
            </AppText>
          </View>
        ) : (
          <FlatList
            data={visiblePosts}
            windowSize={4}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            removeClippedSubviews
            viewabilityConfig={{
              itemVisiblePercentThreshold: 80,
              minimumViewTime: 150,
            }}
            renderItem={({ item }) => (
              <FeedItem
                item={item}
                height={itemHeight}
                width={width}
                muted={muted}
                onToggleMute={() => setMuted((prev) => !prev)}
                ref={(feedRef) => {
                  mediaRefs.current[item.id] = feedRef;
                }}
              />
            )}
            pagingEnabled
            snapToAlignment="start"
            keyExtractor={(item) => item.id}
            decelerationRate="fast"
            snapToInterval={itemHeight}
            getItemLayout={(_, index) => ({
              length: itemHeight,
              offset: itemHeight * index,
              index,
            })}
            onViewableItemsChanged={onViewableItemsChanged.current}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.textMuted}
              />
            }
          />
        )}
      </View>
    </Screen>
  );
}
