import { StyleSheet, Text, View } from "react-native";
import Screen from "../../../components/layout/Screen";
import { useTheme } from "../../../theme/useTheme";

export default function NotificationsScreen() {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      backgroundColor: "#ffffff",
    },
    content: {
      padding: theme.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      flexGrow: 1,
    },
    title: {
      color: "#111111",
      fontSize: 18,
      marginBottom: theme.spacing.sm,
    },
    body: {
      color: "#6B6B6B",
      textAlign: "center",
      fontSize: 14,
    },
  });

  return (
    <Screen scroll padding={false} style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.body}>Notification preferences are coming soon.</Text>
    </Screen>
  );
}
