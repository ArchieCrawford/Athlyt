import { View } from "react-native";
import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { useTheme } from "../../theme/useTheme";

export default function Landing({ navigation }: any) {
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.lg }}>
        <AppText variant="title">Tayp</AppText>
        <AppText variant="muted">
          Build your athlete profile. Get discovered. Message coaches.
        </AppText>
        <View style={{ gap: theme.spacing.md }}>
          <Button
            title="Sign in"
            onPress={() => navigation.navigate("auth", { mode: "login" })}
          />
          <Button
            variant="secondary"
            title="Create account"
            onPress={() => navigation.navigate("auth", { mode: "signup" })}
          />
        </View>
      </View>
    </Screen>
  );
}
