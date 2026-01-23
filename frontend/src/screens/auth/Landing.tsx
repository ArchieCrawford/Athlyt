import React from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { RootStackParamList } from "../../navigation/main";

export type LandingScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "landing"
>;

export default function Landing({ navigation }: LandingScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={[styles.background, { backgroundColor: theme.colors.bg }]}>
        <View style={styles.overlay} />
        <View style={styles.content}>
          <AppText variant="headline" style={styles.title}>
            Tap into Tayp
          </AppText>
          <AppText variant="muted" style={styles.subtitle}>
            Share moments, connect with athletes, and grow your network.
          </AppText>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate("auth")}
            style={{ marginTop: theme.spacing.lg, width: "100%" }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  background: { flex: 1, justifyContent: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 28,
    gap: 12,
  },
  title: { color: "#fff" },
  subtitle: { color: "#d0d0d0" },
});
