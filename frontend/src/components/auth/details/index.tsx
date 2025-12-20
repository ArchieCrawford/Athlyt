import { Dispatch, SetStateAction, useState } from "react";
import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import useAuth from "../../../hooks/useAuth";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

export interface AuthDetailsProps {
  authPage: 0 | 1;
  setAuthPage: Dispatch<SetStateAction<0 | 1>>;
  setMenuMessage: Dispatch<SetStateAction<string>>;
  setDetailsPage: Dispatch<SetStateAction<boolean>>;
}

/**
 * Function that renders a component that renders a signin/signup
 * form.
 *
 * @param props passed to component
 * @param props.authPage if 0 it is in the signin state
 * if 1 is in the signup state
 * @param props.setDetailsPage setter for the variable that chooses
 * the type of page, if true show AuthMenu else show AuthDetails
 * @returns Component
 */
export default function AuthDetails({
  authPage,
  setAuthPage,
  setMenuMessage,
  setDetailsPage,
}: AuthDetailsProps) {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp } = useAuth();

  const handleLogin = () => {
    signIn(email.trim(), password)
      .then(() => setMenuMessage(""))
      .catch((err) => {
        const msg = err?.message || "Login failed. Check your details.";
        setMenuMessage(msg);
      });
  };

  const handleRegister = () => {
    signUp(email.trim(), password)
      .then(() => {
        setDetailsPage(false);
        setAuthPage(1);
        setMenuMessage("Check your email to confirm.");
      })
      .catch((err) => {
        const msg = err?.message || "Sign up failed. Try again.";
        setMenuMessage(msg);
      });
  };

  return (
    <View style={{ flex: 1, gap: theme.spacing.lg }}>
      <Pressable
        onPress={() => setDetailsPage(false)}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        <Feather name="arrow-left" size={22} color={theme.colors.text} />
      </Pressable>

      <View style={{ gap: theme.spacing.md }}>
        <AppText variant="subtitle">
          {authPage == 0 ? "Welcome back" : "Create your account"}
        </AppText>
        <AppText variant="muted">
          {authPage == 0
            ? "Train, post, get discovered."
            : "Join the athlete network."}
        </AppText>
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <Input
          onChangeText={(text) => setEmail(text)}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
          placeholder="Password"
        />
      </View>

      <Button
        title={authPage == 0 ? "Sign In" : "Sign Up"}
        onPress={() => (authPage == 0 ? handleLogin() : handleRegister())}
      />
    </View>
  );
}
