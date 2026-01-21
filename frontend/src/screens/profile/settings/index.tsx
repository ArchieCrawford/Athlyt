import { Alert, StyleSheet, Text, View } from "react-native";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";
import SettingsRow from "./SettingsRow";
import { supabase } from "../../../../supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../../../navigation/settings";

export default function SettingsHomeScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
    }
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
  });

  return (
    <Screen scroll padding={false} style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Account"
          onPress={() => navigation.navigate("Account")}
        />
      </View>

      <Text style={styles.sectionTitle}>Content & display</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Privacy"
          onPress={() => navigation.navigate("Privacy")}
        />
        <SettingsRow
          label="Security & permissions"
          onPress={() => navigation.navigate("SecurityPermissions")}
        />
        <SettingsRow
          label="Notifications"
          onPress={() => navigation.navigate("Notifications")}
        />
      </View>

      <Text style={styles.sectionTitle}>Support</Text>
      <View style={styles.sectionCard}>
        <SettingsRow label="Legal" onPress={() => navigation.navigate("Legal")} />
      </View>

      <Text style={styles.sectionTitle}>Developer</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Developer API"
          onPress={() => navigation.navigate("DeveloperApi")}
        />
      </View>

      <Text style={styles.sectionTitle}>Logout</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Log out"
          destructive
          showChevron={false}
          onPress={handleLogout}
        />
      </View>
    </Screen>
  );
}
