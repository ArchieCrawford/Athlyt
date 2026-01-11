import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Image, View } from "react-native";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";
import styles from "./styles";
import { Post } from "../../../../types";
import { useUser } from "../../../hooks/useUser";
import PostSingleOverlay from "./overlay";
import { getMediaPublicUrl, getMuxThumbnail } from "../../../utils/mediaUrls";

export interface PostSingleHandles {
  play: () => Promise<void>;
  stop: () => Promise<void>;
  unload: () => Promise<void>;
}

/**
 * This component is responsible for displaying a post and play the
 * media associated with it.
 *
 * The ref is forwarded to this component so that the parent component
 * can manage the play status of the video.
 */
export const PostSingle = forwardRef<PostSingleHandles, { item: Post }>(
  ({ item }, parentRef) => {
    const muxPlaybackId = item.mux_playback_id;
    const muxStreamUrl = muxPlaybackId
      ? `https://stream.mux.com/${muxPlaybackId}.m3u8`
      : undefined;
    const muxPosterUrl = getMuxThumbnail(muxPlaybackId);
    const rawMediaPath = item.media_path ?? item.media?.[0];
    const rawThumbPath = item.thumb_path ?? item.poster_url ?? item.media?.[1];
    const inferredImage =
      typeof rawMediaPath === "string" &&
      /\.(png|jpe?g|webp|gif)$/i.test(rawMediaPath.split("?")[0]);
    const isImage =
      item.media_type === "image" || (!item.media_type && inferredImage);
    const mediaUrl = getMediaPublicUrl(rawMediaPath);
    const thumbUrl = getMediaPublicUrl(rawThumbPath);
    const videoUri = isImage ? undefined : muxStreamUrl ?? undefined;
    const hasVideo = Boolean(videoUri);
    const poster = isImage ? (thumbUrl ?? mediaUrl) : muxPosterUrl ?? null;
    const source = ({ uri: hasVideo ? videoUri : "" } as VideoSource);
    const player = useVideoPlayer(source, (p) => {
      p.loop = true;
    });
    const user = useUser(item.creator).data;

    useImperativeHandle(parentRef, () => ({
      play,
      stop,
      unload,
    }));

    useEffect(() => {
      return () => {
        unload()
          .then(() => {})
          .catch((e) => {
            console.log("Failed to unload:", e);
          });
      };
    }, []);

    /**
     * Plays the video in the component if the ref
     * of the video is not null.
     *
     * @returns {void}
     */
    const play = async () => {
      if (!hasVideo) return;
      try {
        if (player.playing) return;
        player.play();
      } catch (e) {
        console.log("An error occurred:", e);
      }
    };

    /**
     * Stops the video in the component if the ref
     * of the video is not null.
     *
     * @returns {void}
     */
    const stop = async () => {
      if (!hasVideo) return;
      try {
        if (!player.playing) return;
        player.pause();
      } catch (e) {
        console.log("An error occurred:", e);
      }
    };

    /**
     * Unloads the video in the component if the ref
     * of the video is not null.
     *
     * This will make sure unnecessary video instances are
     * not in memory at all times
     *
     * @returns {void}
     */
    const unload = async () => {
      if (!hasVideo) return;
      try {
        player.pause();
        player.currentTime = 0;
      } catch (e) {
        console.log(e);
      }
    };

    return (
      <>
        {user && <PostSingleOverlay user={user} post={item} />}
        {isImage || !hasVideo ? (
          poster ? (
            <Image
              style={styles.container}
              source={{ uri: poster }}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.container} />
          )
        ) : (
          <VideoView
            style={styles.container}
            contentFit="cover"
            nativeControls={false}
            poster={poster}
            posterResizeMode="cover"
            player={player}
          />
        )}
      </>
    );
  },
);

export default PostSingle;
