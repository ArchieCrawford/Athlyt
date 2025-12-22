import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
export default function ProfileNavBar({
  user,
  onMenuPress,
}: {
  user: RootState["auth"]["currentUser"];
  onMenuPress?: () => void;
}) {
  const theme = useTheme();

  return (
    user && (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.bg,
        }}
      >
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Feather name="search" size={20} color={theme.colors.text} />
        </Pressable>
        <AppText
          variant="subtitle"
          style={{ flex: 1, textAlign: "center" }}
          numberOfLines={1}
        >
          {user.email}
        </AppText>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={onMenuPress}
        >
          <Feather name="menu" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
    )
  );
}
