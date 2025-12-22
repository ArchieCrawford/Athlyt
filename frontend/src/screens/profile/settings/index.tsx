import { View } from "react-native";
import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import Button from "../../../components/ui/Button";
import Divider from "../../../components/ui/Divider";
import { useTheme } from "../../../theme/useTheme";
import useAuth from "../../../hooks/useAuth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";

export default function ProfileSettingsScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen scroll>
      <AppText variant="title">Settings and privacy</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Manage account and privacy controls.
      </AppText>
      <View style={{ marginTop: theme.spacing.lg }}>
        <Divider />
      </View>
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
        <AppText variant="subtitle">Account</AppText>
        <Button
          title="Change Password"
          variant="secondary"
          onPress={() => navigation.navigate("changePassword")}
        />
        <Button title="Log out" variant="ghost" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
