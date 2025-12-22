import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
export default function ProfileNavBar({
  user,
  onMenuPress,
}: {
  user: RootState["auth"]["currentUser"];
  onMenuPress?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    user && (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.sm,
          paddingBottom: theme.spacing.md,
          backgroundColor: theme.colors.bg,
          gap: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="user-plus" size={20} color={theme.colors.text} />
          </Pressable>
          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="music" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
        <AppText
          variant="subtitle"
          style={{ flex: 1, textAlign: "center" }}
          numberOfLines={1}
        >
          {user.displayName || "@user"}
        </AppText>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="share-2" size={20} color={theme.colors.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={onMenuPress}
          >
            <Feather name="menu" size={22} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>
    )
  );
}
