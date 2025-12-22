import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";

export default function ActivityCenterScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <AppText variant="title">Activity center</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Coming soon.
      </AppText>
    </Screen>
  );
}
