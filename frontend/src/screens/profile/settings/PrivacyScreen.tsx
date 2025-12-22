import { StyleSheet, Switch, Text, View } from "react-native";
import { useState } from "react";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";
import SettingsRow from "./SettingsRow";

export default function SettingsPrivacyScreen() {
  const theme = useTheme();
  const [privateAccount, setPrivateAccount] = useState(false);

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
      <Text style={styles.sectionTitle}>Privacy</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Private account"
          rightSlot={
            <Switch
              value={privateAccount}
              onValueChange={setPrivateAccount}
              trackColor={{ false: "#E5E5E5", true: theme.colors.accent }}
              thumbColor="#ffffff"
            />
          }
          showChevron={false}
        />
      </View>
    </Screen>
  );
}
