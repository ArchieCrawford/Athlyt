import { Dispatch, SetStateAction, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "./styles";
import useAuth from "../../../hooks/useAuth";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp } = useAuth();

  const handleLogin = () => {
    signIn(email.trim(), password)
      .then(() => setMenuMessage(""))
      .catch(() => setMenuMessage("Login failed. Check your details."));
  };

  const handleRegister = () => {
    signUp(email.trim(), password)
      .then(() => {
        setDetailsPage(false);
        setAuthPage(1);
        setMenuMessage("Check your email to confirm.");
      })
      .catch(() => setMenuMessage("Sign up failed. Try again."));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setDetailsPage(false)}>
        <Feather name="arrow-left" size={24} color="black" />
      </TouchableOpacity>
      <TextInput
        onChangeText={(text) => setEmail(text)}
        style={styles.textInput}
        placeholder="Email"
      />
      <TextInput
        onChangeText={(text) => setPassword(text)}
        style={styles.textInput}
        secureTextEntry
        placeholder="Password"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => (authPage == 0 ? handleLogin() : handleRegister())}
      >
        <Text style={styles.buttonText}>
          {authPage == 0 ? "Sign In" : "Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
