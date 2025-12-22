import { Alert, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";
import { RootState } from "../../../redux/store";
import SettingsRow from "./SettingsRow";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../../../navigation/settings";

export default function SettingsAccountScreen() {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.currentUser);
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const handleDeleteAccount = () => {
    Alert.alert("Delete account", "This feature is coming soon.");
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: "#ffffff",
    },
    content: {
      paddingBottom: theme.spacing.xl,
    },
    sectionTitle: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      color: "#6B6B6B",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    sectionCard: {
      marginHorizontal: theme.spacing.lg,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#E5E5E5",
      backgroundColor: "#ffffff",
    },
    helper: {
      paddingHorizontal: theme.spacing.lg,
      color: "#6B6B6B",
      marginBottom: theme.spacing.md,
    },
  });

  return (
    <Screen scroll padding={false} style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account details</Text>
      <View style={styles.sectionCard}>
        <SettingsRow label="Email" value={user?.email ?? "Not set"} />
        <SettingsRow label="Phone" value="Not set" />
        <SettingsRow
          label="Change password"
          onPress={() => navigation.navigate("ChangePassword")}
        />
      </View>

      <Text style={styles.sectionTitle}>Manage</Text>
      <Text style={styles.helper}>Delete account is permanent.</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Delete account"
          destructive
          showChevron={false}
          onPress={handleDeleteAccount}
        />
      </View>
    </Screen>
  );
}
