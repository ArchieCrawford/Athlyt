import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";
import SearchUserItem from "../../components/search/userItem";
import { getFollowingIds, getNewUsers, getUsersPage, queryUsersByName } from "../../services/user";
import { getRecentPosts } from "../../services/posts";
import { Post } from "../../../types";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { RootState } from "../../redux/store";
import { keys } from "../../hooks/queryKeys";
import { getMediaPublicUrl, getMuxThumbnail } from "../../utils/mediaUrls";
import { getBlockedUserIds } from "../../services/blocks";

const NEW_USERS_LIMIT = 6;
const NEW_POSTS_LIMIT = 6;
const ALL_USERS_PAGE_SIZE = 20;

type SearchRouteProp = RouteProp<HomeStackParamList, "Discover">;

type SearchTab = "Top" | "Users";

const PostPreviewCard = ({
  post,
  onPress,
}: {
  post: Post;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const isVideo = post.media_type === "video";
  const muxPlaybackId = post.mux_playback_id;
  const muxStreamUrl = muxPlaybackId
    ? `https://stream.mux.com/${muxPlaybackId}.m3u8`
    : undefined;
  const muxPosterUrl = getMuxThumbnail(muxPlaybackId);
  const rawMediaPath = post.media_path ?? post.media?.[0];
  const rawThumbPath = post.poster_url ?? post.thumb_path ?? post.media?.[1];
  const mediaUrl = getMediaPublicUrl(rawMediaPath);
  const thumbUrl = getMediaPublicUrl(rawThumbPath);
  const posterUrl = isVideo ? muxPosterUrl ?? thumbUrl ?? null : thumbUrl ?? mediaUrl ?? null;
  const source = ({ uri: isVideo && muxStreamUrl ? muxStreamUrl : "" } as VideoSource);
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          marginHorizontal: theme.spacing.md,
          marginBottom: theme.spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={{
          height: 210,
          borderRadius: theme.radius.lg,
          overflow: "hidden",
          backgroundColor: theme.colors.surface2,
        }}
      >
        {isVideo ? (
          <VideoView
            style={{ flex: 1 }}
            contentFit="cover"
            nativeControls={false}
            poster={posterUrl ?? undefined}
            posterResizeMode="cover"
            player={player}
          />
        ) : posterUrl ? (
          <Image
            style={{ flex: 1 }}
            source={{ uri: posterUrl }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: theme.colors.surface2 }} />
        )}
      </View>
      <AppText
        variant="caption"
        style={{ color: theme.colors.textMuted, marginTop: theme.spacing.xs }}
        numberOfLines={2}
      >
        {post.description || "New post"}
      </AppText>
    </Pressable>
  );
};

export default function SearchScreen({ route }: { route?: SearchRouteProp }) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const [textInput, setTextInput] = useState(route?.params?.query ?? "");
  const [activeTab, setActiveTab] = useState<SearchTab>("Top");
  const searchQuery = textInput.trim();

  const { data: blockedUserIds = [] } = useQuery({
    queryKey: keys.blockedUsers(currentUserId ?? ""),
    queryFn: () => getBlockedUserIds(currentUserId ?? undefined),
    enabled: !!currentUserId,
  });

  useEffect(() => {
    if (route?.params?.query) {
      setTextInput(route.params.query);
    }
  }, [route?.params?.query]);

  const { data: searchUsers = [], isFetching: searchLoading } = useQuery({
    queryKey: keys.userSearch(
      searchQuery,
      [currentUserId ?? "", blockedUserIds.join(",")].join("|"),
    ),
    queryFn: () =>
      queryUsersByName(
        searchQuery,
        currentUserId ? [currentUserId, ...blockedUserIds] : blockedUserIds,
      ),
    enabled: searchQuery.length > 0,
  });

  const { data: followingIds = [] } = useQuery({
    queryKey: keys.followingIds(currentUserId ?? ""),
    queryFn: () => getFollowingIds(currentUserId ?? undefined),
    enabled: !!currentUserId && searchQuery.length === 0 && activeTab === "Top",
  });

  const { data: newUsers = [], isFetching: newUsersLoading } = useQuery({
    queryKey: [...keys.newUsers(currentUserId ?? ""), blockedUserIds.join(",")],
    queryFn: () =>
      getNewUsers(
        currentUserId ?? undefined,
        NEW_USERS_LIMIT,
        blockedUserIds,
      ),
    enabled: searchQuery.length === 0 && activeTab === "Top",
  });

  const { data: newPosts = [], isFetching: newPostsLoading } = useQuery({
    queryKey: [
      ...keys.newPosts(currentUserId ?? "", true),
      followingIds.join(","),
      blockedUserIds.join(","),
    ],
    queryFn: () =>
      getRecentPosts({
        limit: NEW_POSTS_LIMIT,
        excludeUserId: currentUserId ?? undefined,
        excludeUserIds: [...followingIds, ...blockedUserIds],
      }),
    enabled: searchQuery.length === 0 && activeTab === "Top",
  });

  const allUsersQuery = useInfiniteQuery({
    queryKey: [...keys.allUsers(currentUserId ?? ""), blockedUserIds.join(",")],
    queryFn: ({ pageParam = 0 }) =>
      getUsersPage({
        limit: ALL_USERS_PAGE_SIZE,
        offset: pageParam,
        excludeIds: currentUserId
          ? [currentUserId, ...blockedUserIds]
          : blockedUserIds,
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: searchQuery.length === 0 && activeTab === "Users",
  });

  const allUsers = useMemo(
    () => allUsersQuery.data?.pages.flatMap((page) => page.users) ?? [],
    [allUsersQuery.data],
  );

  const renderSearchResults = () => (
    <FlatList
      data={searchUsers}
      renderItem={({ item }) => <SearchUserItem item={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
      }}
      ListEmptyComponent={
        searchQuery.length > 0 ? (
          <View
            style={{
              paddingTop: theme.spacing.lg,
              alignItems: "center",
              gap: theme.spacing.xs,
            }}
          >
            {searchLoading ? (
              <ActivityIndicator color={theme.colors.textMuted} />
            ) : (
              <>
                <AppText variant="body">No users found</AppText>
                <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                  Try a different name or username.
                </AppText>
              </>
            )}
          </View>
        ) : null
      }
    />
  );

  const renderTopHeader = () => (
    <View>
      <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm }}>
        <AppText variant="subtitle">New Users</AppText>
      </View>
      {newUsersLoading ? (
        <View style={{ paddingVertical: theme.spacing.md }}>
          <ActivityIndicator color={theme.colors.textMuted} />
        </View>
      ) : newUsers.length > 0 ? (
        newUsers.map((user) => <SearchUserItem key={user.id} item={user} />)
      ) : (
        <View style={{ paddingHorizontal: theme.spacing.md }}>
          <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
            No new users yet.
          </AppText>
        </View>
      )}
      <View
        style={{
          paddingHorizontal: theme.spacing.md,
          marginTop: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        }}
      >
        <AppText variant="subtitle">New Posts</AppText>
      </View>
      {newPostsLoading && newPosts.length === 0 ? (
        <View style={{ paddingVertical: theme.spacing.md }}>
          <ActivityIndicator color={theme.colors.textMuted} />
        </View>
      ) : null}
    </View>
  );

  const renderNewPosts = ({ item }: { item: Post }) => (
    <PostPreviewCard
      post={item}
      onPress={() =>
        navigation.navigate("userPosts", {
          creator: item.creator,
          profile: true,
        })
      }
    />
  );

  const renderAllUsersFooter = () => {
    if (!allUsersQuery.hasNextPage) {
      return null;
    }
    return (
      <View style={{ paddingVertical: theme.spacing.md }}>
        {allUsersQuery.isFetchingNextPage ? (
          <ActivityIndicator color={theme.colors.textMuted} />
        ) : null}
      </View>
    );
  };

  return (
    <Screen padding={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Input
          onChangeText={setTextInput}
          placeholder="Search athletes"
          value={textInput}
        />
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
            marginTop: theme.spacing.sm,
          }}
        >
          {(["Top", "Users"] as SearchTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText
                variant="caption"
                style={{
                  color:
                    activeTab === tab
                      ? theme.colors.text
                      : theme.colors.textMuted,
                }}
              >
                {tab}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      {searchQuery.length > 0 ? (
        renderSearchResults()
      ) : activeTab === "Users" ? (
        <FlatList
          data={allUsers}
          renderItem={({ item }) => <SearchUserItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.lg,
          }}
          onEndReached={() => {
            if (allUsersQuery.hasNextPage && !allUsersQuery.isFetchingNextPage) {
              allUsersQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderAllUsersFooter}
          ListEmptyComponent={
            allUsersQuery.isFetching ? (
              <View style={{ paddingVertical: theme.spacing.lg }}>
                <ActivityIndicator color={theme.colors.textMuted} />
              </View>
            ) : (
              <View style={{ paddingVertical: theme.spacing.lg }}>
                <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                  No users available.
                </AppText>
              </View>
            )
          }
        />
      ) : (
        <FlatList
          data={newPosts}
          renderItem={renderNewPosts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderTopHeader}
          contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
          ListEmptyComponent={
            !newPostsLoading ? (
              <View
                style={{
                  paddingTop: theme.spacing.lg,
                  alignItems: "center",
                }}
              >
                <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                  No new posts yet.
                </AppText>
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
