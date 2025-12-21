import { Image, StyleSheet, View } from "react-native";
import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { useTheme } from "../../theme/useTheme";

export default function Landing({ navigation }: any) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
    },
    logo: {
      width: 72,
      height: 72,
      marginTop: 96,
      marginBottom: 24,
      alignSelf: "flex-start",
    },
    title: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 20,
      color: theme.colors.textMuted,
      marginBottom: 32,
    },
    buttons: {
      gap: 12,
      marginBottom: 8,
    },
    primaryButton: {
      height: 52,
      borderRadius: 12,
      paddingVertical: 0,
    },
    secondaryButton: {
      height: 52,
      borderRadius: 12,
      paddingVertical: 0,
      backgroundColor: theme.colors.surface2,
    },
    primaryText: {
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryText: {
      fontSize: 15,
      fontWeight: "500",
    },
    helper: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
  });

  return (
    <Screen padding={false}>
      <View style={styles.container}>
        <Image
          source={require("../../theme/assets/tayp_cover.png")}
          resizeMode="contain"
          style={styles.logo}
        />
        <AppText style={styles.title}>Tayp</AppText>
        <AppText style={styles.subtitle}>Study the tape. Get seen.</AppText>
        <View style={styles.buttons}>
          <Button
            title="Sign in"
            style={styles.primaryButton}
            textStyle={styles.primaryText}
            onPress={() => navigation.navigate("auth", { mode: "login" })}
          />
          <Button
            variant="secondary"
            title="Create your account"
            style={styles.secondaryButton}
            textStyle={styles.secondaryText}
            onPress={() => navigation.navigate("auth", { mode: "signup" })}
          />
        </View>
        <AppText style={styles.helper}>Takes less than a minute.</AppText>
      </View>
    </Screen>
  );
}
