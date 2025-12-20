import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { FeedStackParamList } from "../../navigation/feed/types";
import { CurrentUserProfileItemInViewContext } from "../../navigation/feed/context";
import { getFeed, getPostsByUserId } from "../../services/posts";
import { Post } from "../../../types";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import Screen from "../../components/layout/Screen";
import FeedItem, { FeedItemHandles } from "./FeedItem";

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
  const { setCurrentUserProfileItemInView } = useContext(
    CurrentUserProfileItemInViewContext,
  );

  const params = (route?.params ?? {}) as Partial<{
    creator: string;
    profile: boolean;
  }>;
  const creator = params.creator ?? "";
  const profile = params.profile ?? false;

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mediaRefs = useRef<Record<string, FeedItemHandles | null>>({});

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const nextPosts = profile && creator
        ? await getPostsByUserId(creator)
        : await getFeed();
      setPosts(nextPosts);
    } catch (err) {
      console.error("Failed to load feed", err);
      setError("Unable to load posts");
      setPosts([]);
    }
  }, [creator, profile]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const onViewableItemsChanged = useRef(
    ({ changed }: { changed: PostViewToken[] }) => {
      changed.forEach((element) => {
        const cell = mediaRefs.current[element.key];

        if (cell) {
          if (element.isViewable) {
            if (!profile && setCurrentUserProfileItemInView) {
              setCurrentUserProfileItemInView(element.item.creator);
            }
            cell.play();
          } else {
            cell.stop();
          }
        }
      });
    },
  );

  const feedItemHeight = height;

  return (
    <Screen fullBleed padding={false} style={{ backgroundColor: theme.colors.bg }}>
      {posts === null ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.colors.bg,
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : posts.length === 0 ? (
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
          <AppText variant="subtitle">
            {error ? "Could not load posts" : "No posts yet"}
          </AppText>
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
          data={posts}
          windowSize={4}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          viewabilityConfig={{
            itemVisiblePercentThreshold: 0,
          }}
          renderItem={({ item }) => (
            <FeedItem
              item={item}
              height={feedItemHeight}
              width={width}
              ref={(feedRef) => {
                mediaRefs.current[item.id] = feedRef;
              }}
            />
          )}
          pagingEnabled
          snapToAlignment="start"
          keyExtractor={(item) => item.id}
          decelerationRate="fast"
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
    </Screen>
  );
}
