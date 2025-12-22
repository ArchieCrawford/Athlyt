import { View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import { DrawerActions, useNavigation } from "@react-navigation/native";

export default function ProfileNavBar({
  user,
}: {
  user: RootState["auth"]["currentUser"];
}) {
  const theme = useTheme();
  const navigation = useNavigation();

  const openMenu = () => {
    const parent = navigation.getParent();
    if (parent?.getState?.().type === "drawer") {
      parent.dispatch(DrawerActions.openDrawer());
    }
  };

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
          onPress={openMenu}
        >
          <Feather name="menu" size={22} color={theme.colors.text} />
        </Pressable>
      </View>
    )
  );
}
