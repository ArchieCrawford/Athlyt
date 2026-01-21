import { Alert, Platform, Pressable, Share, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";
import { useSelector } from "react-redux";
export default function ProfileNavBar({
  user,
  onMenuPress,
}: {
  user: RootState["auth"]["currentUser"];
  onMenuPress?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const isSelf = currentUserId && user?.uid === currentUserId;

  const handleShareProfile = async () => {
    if (!user?.uid) {
      Alert.alert("Share failed", "Profile unavailable.");
      return;
    }
    const username =
      user.username || user.displayName || user.email?.split("@")[0] || "user";
    const deepLink = `tayp://u/${user.uid}`;
    const message = `Find me on Tayp: ${username}\n${deepLink}`;

    try {
      await Share.share(
        Platform.OS === "ios" ? { url: deepLink, message } : { message },
      );
    } catch (error) {
      Alert.alert("Share failed", "Unable to open the share sheet.");
    }
  };

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
          {isSelf ? (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => navigation.navigate("findFriends")}
            >
              <Feather name="user-plus" size={20} color={theme.colors.text} />
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() =>
              Alert.alert("Coming soon", "Music features are coming soon.")
            }
          >
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
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={handleShareProfile}
          >
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
