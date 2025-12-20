import { View, FlatList } from "react-native";
import ProfilePostListItem from "./item";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";

export default function ProfilePostList({
  posts,
}: {
  posts: RootState["post"]["currentUserPosts"];
}) {
  const theme = useTheme();

  return (
    <View style={{ paddingTop: theme.spacing.lg }}>
      <FlatList
        numColumns={3}
        scrollEnabled={false}
        removeClippedSubviews
        nestedScrollEnabled
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfilePostListItem item={item} />}
      />
    </View>
  );
}
