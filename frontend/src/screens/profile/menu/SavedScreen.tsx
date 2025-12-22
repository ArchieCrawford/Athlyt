import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";

export default function SavedScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <AppText variant="title">Saved</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Coming soon.
      </AppText>
    </Screen>
  );
}
