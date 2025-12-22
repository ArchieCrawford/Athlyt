import { StyleSheet } from "react-native";
import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import { useTheme } from "../../theme/useTheme";

export default function LegalDocument({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    body: {
      marginTop: theme.spacing.md,
      lineHeight: 20,
      color: "#444444",
    },
    title: {
      color: "#111111",
    },
  });

  return (
    <Screen scroll style={{ backgroundColor: "#ffffff" }}>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="body" style={styles.body}>
        {content}
      </AppText>
    </Screen>
  );
}
