import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  ImageBackground,
  Pressable,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Post } from "../../../types";
import { useTheme } from "../../theme/useTheme";
import { useUser } from "../../hooks/useUser";
import { RootStackParamList } from "../../navigation/main";
import { RootState, AppDispatch } from "../../redux/store";
import { openCommentModal } from "../../redux/slices/modalSlice";
import { getLikeById, updateLike } from "../../services/posts";
import AppText from "../../components/ui/AppText";
import { queryUsersByName } from "../../services/user";
import ActionRail from "./components/ActionRail";
import CaptionBlock from "./components/CaptionBlock";

export interface FeedItemHandles {
  play: () => void;
  stop: () => void;
  unload: () => void;
}

interface FeedItemProps {
  item: Post;
  height: number;
  width: number;
  muted: boolean;
  onToggleMute: () => void;
}

const FALLBACK_VIDEO_SOURCE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const FeedItem = forwardRef<FeedItemHandles, FeedItemProps>(
  ({ item, height, width, muted, onToggleMute }, parentRef) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const dispatch = useDispatch<AppDispatch>();
    const currentUserId = useSelector(
      (state: RootState) => state.auth.currentUser?.uid,
    );
    const user = useUser(item.creator).data;
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(item.likesCount || 0);
    const [bookmarked, setBookmarked] = useState(false);
    const [bookmarkCount, setBookmarkCount] = useState(
      item.bookmarksCount || 0,
    );

    const heartScale = useRef(new Animated.Value(0.6)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    const triggerHeart = () => {
      heartScale.setValue(0.6);
      heartOpacity.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(heartOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.spring(heartScale, {
            toValue: 1.15,
            useNativeDriver: true,
            friction: 6,
          }),
        ]),
        Animated.parallel([
          Animated.timing(heartOpacity, {
            toValue: 0,
            duration: 180,
            delay: 120,
            useNativeDriver: true,
          }),
          Animated.spring(heartScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
          }),
        ]),
      ]).start();
    };

    useEffect(() => {
      if (!currentUserId || !item.id) {
        return;
      }
      getLikeById(item.id, currentUserId)
        .then((state) => setLiked(state))
        .catch(() => {});
    }, [currentUserId, item.id]);

    const handleLike = () => {
      if (!item.id || !currentUserId) {
        return;
      }
      setLiked((prev) => {
        setLikesCount((count) => (prev ? Math.max(count - 1, 0) : count + 1));
        if (!prev) {
          triggerHeart();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        updateLike(item.id, currentUserId, prev).catch((error) => {
          console.log("Failed to update like:", error);
          setLiked(prev);
          setLikesCount((count) =>
            prev ? count + 1 : Math.max(count - 1, 0),
          );
        });
        return !prev;
      });
    };

    const handleBookmark = () => {
      setBookmarked((prev) => {
        setBookmarkCount((count) => (prev ? Math.max(count - 1, 0) : count + 1));
        return !prev;
      });
    };

    const handleComment = () => {
      dispatch(
        openCommentModal({
          open: true,
          data: item,
          modalType: 0,
        }),
      );
    };

    const handleShare = () => {
      Share.share({
        message: "Check this out on Tayp",
      }).catch(() => {});
    };

    const handleMentionPress = async (handle: string) => {
      try {
        const results = await queryUsersByName(handle);
        if (results[0]?.uid) {
          navigation.navigate("profileOther", {
            initialUserId: results[0].uid,
          });
        }
      } catch (error) {
        console.log("Mention lookup failed:", error);
      }
    };

    const description = item.description || "";
    const rawMediaUri = item.media?.[0];
    const inferredImage =
      typeof rawMediaUri === "string" &&
      /\.(png|jpe?g|webp|gif)$/i.test(rawMediaUri.split("?")[0]);
    const isImage =
      item.media_type === "image" || (!item.media_type && inferredImage);
    const videoUri = isImage ? undefined : rawMediaUri;
    const posterUri =
      item.poster_url ||
      (isImage ? item.media?.[0] : item.media?.[1] || item.media?.[0]);
    const hasPlayableVideo =
      !isImage && typeof videoUri === "string" && videoUri.trim().length > 0;
    const username = user?.displayName || user?.email || item.creator;
    const avatarUri = user?.photoURL;
    const showFollow = currentUserId ? currentUserId !== item.creator : true;
    const showShop = /#shop/i.test(description);
    const sharesLabel =
      item.sharesCount !== undefined ? `${item.sharesCount}` : "Share";

    const safeVideoSource = {
      uri: hasPlayableVideo ? videoUri : FALLBACK_VIDEO_SOURCE,
    } as VideoSource;

    const player = useVideoPlayer(
      safeVideoSource,
      (playerInstance) => {
        playerInstance.loop = true;
      },
    );

    useEffect(() => {
      player.muted = muted;
    }, [muted, player]);

    const play = () => {
      if (!hasPlayableVideo) {
        return;
      }
      try {
        if (player.playing) {
          return;
        }
        player.play();
      } catch (error) {
        console.log("Video play error:", error);
      }
    };

    const stop = () => {
      if (!hasPlayableVideo) {
        return;
      }
      try {
        if (!player.playing) {
          return;
        }
        player.pause();
      } catch (error) {
        console.log("Video pause error:", error);
      }
    };

    const unload = () => {
      if (!hasPlayableVideo) {
        return;
      }
      try {
        player.pause();
        player.currentTime = 0;
      } catch (error) {
        console.log("Video unload error:", error);
      }
    };

    useImperativeHandle(parentRef, () => ({
      play,
      stop,
      unload,
    }));

    useEffect(() => {
      return () => {
        unload();
      };
    }, []);

    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            width,
            height,
            backgroundColor: theme.colors.bg,
          },
          media: {
            flex: 1,
            backgroundColor: theme.colors.bg,
          },
          video: {
            ...StyleSheet.absoluteFillObject,
          },
          gradientTop: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: height * 0.35,
          },
          gradientBottom: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: height * 0.45,
          },
          overlay: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: "flex-end",
          },
          actionRail: {
            position: "absolute",
            right: theme.spacing.lg,
            bottom: theme.spacing.lg + insets.bottom,
          },
          caption: {
            position: "absolute",
            left: theme.spacing.lg,
            right: width * 0.28,
            bottom: theme.spacing.lg + insets.bottom,
          },
          heart: {
            position: "absolute",
            alignSelf: "center",
            top: height * 0.38,
          },
        }),
      [height, insets.bottom, theme, width],
    );

    return (
      <View style={styles.container}>
        {posterUri ? (
          <ImageBackground
            source={{ uri: posterUri }}
            resizeMode="cover"
            style={styles.media}
          >
            {!isImage ? (
              <>
                <Pressable
                  onPress={onToggleMute}
                  style={StyleSheet.absoluteFillObject}
                >
                  {hasPlayableVideo ? (
                    <VideoView
                      style={styles.video}
                      contentFit="cover"
                      nativeControls={false}
                      player={player}
                    />
                  ) : null}
                </Pressable>
                <LinearGradient
                  colors={theme.gradients.top}
                  style={styles.gradientTop}
                />
                <LinearGradient
                  colors={theme.gradients.bottom}
                  style={styles.gradientBottom}
                />
                <View style={styles.overlay}>
                  <View style={styles.caption}>
                    <CaptionBlock
                      username={username}
                      text={description}
                      onHashtagPress={(tag) =>
                        navigation.navigate("HashtagResults", { tag })
                      }
                      onMentionPress={handleMentionPress}
                    />
                    <View
                      style={{
                        marginTop: theme.spacing.sm,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: theme.spacing.sm,
                      }}
                    >
                      <Feather
                        name="music"
                        size={14}
                        color={theme.colors.textMuted}
                      />
                      <AppText
                        variant="caption"
                        style={{ color: theme.colors.textMuted }}
                      >
                        Original sound
                      </AppText>
                      {showShop ? (
                        <View
                          style={{
                            marginLeft: theme.spacing.sm,
                            paddingHorizontal: theme.spacing.sm,
                            paddingVertical: 2,
                            borderRadius: theme.radius.sm,
                            backgroundColor: theme.colors.surface2,
                          }}
                        >
                          <AppText variant="caption">Shop</AppText>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <ActionRail
                    style={styles.actionRail}
                    avatarUri={avatarUri}
                    showFollow={showFollow}
                    liked={liked}
                    likes={likesCount}
                    comments={item.commentsCount}
                    bookmarks={bookmarkCount}
                    bookmarked={bookmarked}
                    sharesLabel={sharesLabel}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                    onAvatarPress={() =>
                      navigation.navigate("profileOther", {
                        initialUserId: item.creator,
                      })
                    }
                  />
                </View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.heart,
                    {
                      opacity: heartOpacity,
                      transform: [{ scale: heartScale }],
                    },
                  ]}
                >
                  <Feather name="heart" size={72} color={theme.colors.accent} />
                </Animated.View>
              </>
            ) : null}
          </ImageBackground>
        ) : (
          <View style={styles.media} />
        )}
      </View>
    );
  },
);

export default FeedItem;
