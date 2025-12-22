import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";

export default function ProfileQrScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <AppText variant="title">QR code</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Coming soon.
      </AppText>
    </Screen>
  );
}
