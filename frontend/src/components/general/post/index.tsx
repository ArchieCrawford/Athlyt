import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useVideoPlayer, VideoSource, VideoView } from "expo-video";
import styles from "./styles";
import { Post } from "../../../../types";
import { useUser } from "../../../hooks/useUser";
import PostSingleOverlay from "./overlay";

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
    const muxPosterUrl = muxPlaybackId
      ? `https://image.mux.com/${muxPlaybackId}/thumbnail.jpg`
      : undefined;
    const videoUri = muxStreamUrl ?? item.media?.[0];
    const hasVideo = Boolean(videoUri);
    const poster = item.poster_url || muxPosterUrl || item.media?.[1];
    const source = (hasVideo ? { uri: videoUri } : { uri: "" }) as VideoSource;
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
        <VideoView
          style={styles.container}
          contentFit="cover"
          nativeControls={false}
          poster={poster}
          posterResizeMode="cover"
          player={player}
        />
      </>
    );
  },
);

export default PostSingle;
