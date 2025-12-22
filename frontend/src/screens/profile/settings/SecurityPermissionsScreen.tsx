import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";
import SettingsRow from "./SettingsRow";

export default function SecurityPermissionsScreen() {
  const theme = useTheme();

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert("Unable to open settings", "Open system settings manually.");
    });
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
      <Text style={styles.sectionTitle}>Security & permissions</Text>
      <View style={styles.sectionCard}>
        <SettingsRow label="Camera" onPress={openSettings} />
        <SettingsRow label="Microphone" onPress={openSettings} />
        <SettingsRow label="Photos" onPress={openSettings} />
      </View>
    </Screen>
  );
}
