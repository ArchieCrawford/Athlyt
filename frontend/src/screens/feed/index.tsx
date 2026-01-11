import {
  FlatList,
  View,
  Dimensions,
  ViewToken,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import styles from "./styles";
import PostSingle, { PostSingleHandles } from "../../components/general/post";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { getFeed, getPostsByUserId } from "../../services/posts";
import { Post } from "../../../types";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { FeedStackParamList } from "../../navigation/feed/types";
import { CurrentUserProfileItemInViewContext } from "../../navigation/feed/context";
import useMaterialNavBarHeight from "../../hooks/useMaterialNavBarHeight";

type FeedScreenRouteProp =
  | RouteProp<RootStackParamList, "userPosts">
  | RouteProp<HomeStackParamList, "feed">
  | RouteProp<FeedStackParamList, "feedList">;

interface PostViewToken extends ViewToken {
  item: Post;
}

/**
 * Component that renders a list of posts meant to be
 * used for the feed screen.
 *
 * On start make fetch for posts then use a flatList
 * to display/control the posts.
 */
export default function FeedScreen({ route }: { route: FeedScreenRouteProp }) {
  const { setCurrentUserProfileItemInView } = useContext(
    CurrentUserProfileItemInViewContext,
  );

  const params = (route.params ?? {}) as Partial<{
    creator: string;
    profile: boolean;
  }>;
  const creator = params.creator ?? "";
  const profile = params.profile ?? false;

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mediaRefs = useRef<Record<string, PostSingleHandles | null>>({});
  const activePostIdRef = useRef<string | null>(null);

  const stopAllMedia = useCallback(() => {
    Object.values(mediaRefs.current).forEach((cell) => {
      cell?.stop();
    });
  }, []);

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

  /**
   * Called any time a new post is shown when a user scrolls
   * the FlatList, when this happens we should start playing
   * the post that is viewable and stop all the others
   */
  const onViewableItemsChanged = useRef(
    ({ changed }: { changed: PostViewToken[] }) => {
      changed.forEach((element) => {
        const cell = mediaRefs.current[element.key];

        if (cell) {
          if (element.isViewable) {
            activePostIdRef.current = element.item.id;
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

  const feedItemHeight =
    Dimensions.get("window").height - useMaterialNavBarHeight(profile);
  /**
   * renders the item shown in the FlatList
   *
   * @param {Object} item object of the post
   * @param {Integer} index position of the post in the FlatList
   * @returns
   */
  const renderItem = ({ item, index }: { item: Post; index: number }) => {
    return (
      <View
        style={{
          height: feedItemHeight,
          backgroundColor: "black",
        }}
      >
        <PostSingle
          item={item}
          ref={(PostSingeRef) => {
            mediaRefs.current[item.id] = PostSingeRef;
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {posts === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="white" />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
            {error ? "Could not load posts" : "No posts yet"}
          </Text>
          <Text style={{ color: "white", opacity: 0.75, textAlign: "center" }}>
            {error
              ? "Check your connection and try again."
              : profile
              ? "This user has not posted yet."
              : "Follow athletes and check back soon."}
          </Text>
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
          renderItem={renderItem}
          pagingEnabled
          keyExtractor={(item) => item.id}
          decelerationRate={"fast"}
          onViewableItemsChanged={onViewableItemsChanged.current}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
