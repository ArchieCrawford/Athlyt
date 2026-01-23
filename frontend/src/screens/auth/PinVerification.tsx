import React from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../navigation/main";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";

export type PinVerificationProps = NativeStackScreenProps<
  RootStackParamList,
  "pinVerification"
>;

export default function PinVerification({ navigation }: PinVerificationProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <AppText variant="headline" style={styles.title}>
          Check your email
        </AppText>
        <AppText variant="muted" style={styles.subtitle}>
          We sent a verification link. Open it to finish signing in.
        </AppText>
        <Button
          title="Back to sign in"
          onPress={() => navigation.replace("auth")}
          style={{ width: "100%", marginTop: theme.spacing.lg }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  title: { color: "#fff" },
  subtitle: { color: "#b0b0b0" },
});
