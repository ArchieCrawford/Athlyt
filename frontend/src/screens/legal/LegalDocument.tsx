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
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

  return (
    <Screen scroll>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" style={styles.body}>
        {content}
      </AppText>
    </Screen>
  );
}
