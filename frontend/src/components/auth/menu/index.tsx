import { Dispatch, SetStateAction } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import Button from "../../ui/Button";

export interface AuthMenuProps {
  authPage: number;
  menuMessage: string;
  setAuthPage: Dispatch<SetStateAction<0 | 1>>;
  setDetailsPage: Dispatch<SetStateAction<boolean>>;
}

/**
 * Function that renders a component that renders a menu to allow
 * the user to choose the auth provider and if the method should be
 * signin or signup.
 *
 * @param props passed to component
 * @param props.authPage if 0 it is in the signin state
 * if 1 is in the signup state
 * @param props.setAuthPage setter for the authPage var (0 or 1)
 * @param props.setDetailsPage setter for the variable that chooses
 * the type of page, if true show AuthMenu else show AuthDetails
 * @returns Component
 */
export default function AuthMenu({
  authPage,
  menuMessage,
  setAuthPage,
  setDetailsPage,
}: AuthMenuProps) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: "space-between" }}>
      <View style={{ gap: theme.spacing.lg }}>
        <AppText variant="title">
          {authPage == 0 ? "Sign In" : "Sign Up"}
        </AppText>
        {menuMessage ? (
          <AppText variant="muted">{menuMessage}</AppText>
        ) : null}
        <Button
          title="Use Email"
          onPress={() => setDetailsPage(true)}
          icon={<Feather name="user" size={20} color={theme.colors.text} />}
        />
      </View>

      <Pressable
        onPress={() => (authPage == 0 ? setAuthPage(1) : setAuthPage(0))}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: theme.spacing.xs,
          }}
        >
          <AppText variant="body">
            {authPage == 0 ? "Don't have an account?" : "Already have an account?"}
          </AppText>
          <AppText
            variant="body"
            style={{ color: theme.colors.accent, fontWeight: theme.type.fontWeights.bold }}
          >
            {authPage == 0 ? "Sign Up" : "Sign In"}
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}
