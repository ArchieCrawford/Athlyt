import { Image, Pressable, View } from "react-native";
import { Post } from "../../../../../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { useTheme } from "../../../../theme/useTheme";
import { Feather } from "@expo/vector-icons";
import AppText from "../../../ui/AppText";

export default function ProfilePostListItem({ item }: { item: Post | null }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const media = Array.isArray(item?.media) ? item?.media : [];
  const firstMedia = media[0] ?? "";
  const isVideo = Boolean(
    item?.media_type === "video" ||
      item?.mux_playback_id ||
      /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(firstMedia),
  );
  const muxPosterUri = item?.mux_playback_id
    ? `https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg`
    : undefined;
  const posterUri =
    item?.poster_url ??
    muxPosterUri ??
    media[1] ??
    (!isVideo ? media[0] : undefined);

  return (
    item && (
      <Pressable
        style={({ pressed }) => [
          {
            flex: 1 / 3,
            aspectRatio: 1,
            padding: theme.spacing.xs,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() =>
          navigation.navigate("userPosts", {
            creator: item.creator,
            profile: true,
          })
        }
      >
        {posterUri ? (
          <Image
            style={{
              flex: 1,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surface2,
            }}
            source={{ uri: posterUri }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surface2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="video" size={18} color={theme.colors.textMuted} />
            <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
              Processing
            </AppText>
          </View>
        )}
        {isVideo ? (
          <View
            style={{
              position: "absolute",
              right: theme.spacing.xs,
              bottom: theme.spacing.xs,
              paddingHorizontal: theme.spacing.xs,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: "rgba(0,0,0,0.55)",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Feather name="video" size={12} color="#FFFFFF" />
            <AppText variant="caption" style={{ color: "#FFFFFF" }}>
              Video
            </AppText>
          </View>
        ) : null}
      </Pressable>
    )
  );
}
