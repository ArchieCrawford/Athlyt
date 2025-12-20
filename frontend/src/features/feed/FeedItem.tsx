import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, ImageBackground, StyleSheet, View } from "react-native";
import { VideoSource, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Post } from "../../../types";
import { useTheme } from "../../theme/useTheme";
import { useUser } from "../../hooks/useUser";
import ActionRail from "./components/ActionRail";
import CaptionBlock from "./components/CaptionBlock";

export interface FeedItemHandles {
  play: () => Promise<void>;
  stop: () => Promise<void>;
  unload: () => Promise<void>;
}

interface FeedItemProps {
  item: Post;
  height: number;
  width: number;
}

const FeedItem = forwardRef<FeedItemHandles, FeedItemProps>(
  ({ item, height, width }, parentRef) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const videoRef = useRef<VideoView>(null);
    const user = useUser(item.creator).data;
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(item.likesCount || 0);

    const heartScale = useRef(new Animated.Value(0.6)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    useImperativeHandle(parentRef, () => ({
      play,
      stop,
      unload,
    }));

    useEffect(() => {
      return () => {
        unload().catch(() => {});
      };
    }, []);

    const play = async () => {
      if (!videoRef.current) {
        return;
      }
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status?.isPlaying) {
          return;
        }
        await videoRef.current.play();
      } catch (error) {
        console.log("Video play error:", error);
      }
    };

    const stop = async () => {
      if (!videoRef.current) {
        return;
      }
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status && !status.isPlaying) {
          return;
        }
        await videoRef.current.pause();
      } catch (error) {
        console.log("Video pause error:", error);
      }
    };

    const unload = async () => {
      if (!videoRef.current) {
        return;
      }
      try {
        await videoRef.current.unload();
      } catch (error) {
        console.log("Video unload error:", error);
      }
    };

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

    const handleLike = () => {
      setLiked((prev) => {
        setLikesCount((count) => (prev ? Math.max(count - 1, 0) : count + 1));
        if (!prev) {
          triggerHeart();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        return !prev;
      });
    };

    const description = item.description || "";
    const tags = description.match(/#[\\w-]+/g) ?? [];
    const caption = description.replace(/#[\\w-]+/g, "").trim();
    const posterUri = item.media?.[1] || item.media?.[0];
    const videoUri = item.media?.[0];
    const username = user?.displayName || user?.email || item.creator;
    const avatarUri = user?.photoURL;

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
            {videoUri ? (
              <VideoView
                ref={videoRef}
                style={styles.video}
                contentFit="cover"
                isLooping
                poster={posterUri}
                posterResizeMode="cover"
                source={videoUri as VideoSource}
              />
            ) : null}
            <LinearGradient
              colors={theme.gradients.top}
              style={styles.gradientTop}
            />
            <LinearGradient
              colors={theme.gradients.bottom}
              style={styles.gradientBottom}
            />
            <View style={styles.overlay}>
              <CaptionBlock
                style={styles.caption}
                username={username}
                caption={caption}
                tags={tags}
              />
              <ActionRail
                style={styles.actionRail}
                avatarUri={avatarUri}
                liked={liked}
                likes={likesCount}
                comments={item.commentsCount}
                onLike={handleLike}
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
          </ImageBackground>
        ) : (
          <View style={styles.media} />
        )}
      </View>
    );
  },
);

export default FeedItem;
