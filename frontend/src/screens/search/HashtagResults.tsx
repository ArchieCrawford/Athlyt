import { RouteProp } from "@react-navigation/native";
import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import { useTheme } from "../../theme/useTheme";
import { RootStackParamList } from "../../navigation/main";

type HashtagRouteProp = RouteProp<RootStackParamList, "HashtagResults">;

export default function HashtagResultsScreen({
  route,
}: {
  route: HashtagRouteProp;
}) {
  const theme = useTheme();
  const tag = route.params.tag;
  return (
    <Screen>
      <AppText variant="title">#{tag}</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Results coming soon.
      </AppText>
    </Screen>
  );
}
