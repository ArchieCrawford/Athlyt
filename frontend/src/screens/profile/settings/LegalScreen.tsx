import { StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";
import SettingsRow from "./SettingsRow";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "../../../navigation/settings";

export default function SettingsLegalScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? "1.0.0";
  const effectiveDate = "December 21, 2025";

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
    footer: {
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.xs,
    },
    footerText: {
      color: "#6B6B6B",
      fontSize: 12,
    },
  });

  return (
    <Screen scroll padding={false} style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Terms of Service"
          onPress={() => navigation.navigate("LegalTerms")}
        />
        <SettingsRow
          label="Privacy Policy"
          onPress={() => navigation.navigate("LegalPrivacy")}
        />
        <SettingsRow
          label="Community Guidelines"
          onPress={() => navigation.navigate("LegalCommunity")}
        />
        <SettingsRow
          label="Athlete Content License"
          onPress={() => navigation.navigate("LegalLicense")}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Effective date: {effectiveDate}</Text>
        <Text style={styles.footerText}>App version: {appVersion}</Text>
      </View>
    </Screen>
  );
}
