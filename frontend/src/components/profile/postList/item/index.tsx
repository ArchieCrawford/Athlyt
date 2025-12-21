import { Image, Pressable } from "react-native";
import { Post } from "../../../../../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { useTheme } from "../../../../theme/useTheme";

export default function ProfilePostListItem({ item }: { item: Post | null }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  const firstMedia = item?.media[0] ?? "";
  const isVideo = Boolean(
    item?.media_type === "video" ||
      item?.mux_playback_id ||
      /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(firstMedia),
  );
  const posterUri =
    item?.poster_url ?? item?.media[1] ?? (!isVideo ? item?.media[0] : undefined);

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
        <Image
          style={{
            flex: 1,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surface2,
          }}
          source={{ uri: posterUri }}
        />
      </Pressable>
    )
  );
}
