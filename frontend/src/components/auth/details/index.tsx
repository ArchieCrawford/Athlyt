import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";
import useAuth from "../../../hooks/useAuth";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import { logAuthEvent } from "../../../services/telemetry";
import { signInWithProvider } from "../../../services/oauth";

export interface AuthDetailsProps {
  authPage: 0 | 1;
  menuMessage: string;
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
  menuMessage,
  setAuthPage,
  setMenuMessage,
  setDetailsPage,
}: AuthDetailsProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(
    null,
  );
  const { signIn, signUp } = useAuth();
  const accent = "#35D37A";
  const isLogin = authPage === 0;

  const handleLogin = () => {
    signIn(email.trim(), password)
      .then(() => setMenuMessage(""))
      .catch((err) => {
        const msg = err?.message || "Login failed. Check your details.";
        setMenuMessage(msg);
        logAuthEvent("login_failed", { email, error: msg });
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

  const handleOAuth = async (provider: "apple" | "google") => {
    if (oauthLoading) {
      return;
    }
    setOauthLoading(provider);
    try {
      await signInWithProvider(provider);
      setMenuMessage("");
    } catch (err: any) {
      const msg = err?.message || "Social sign-in failed.";
      logAuthEvent("oauth_failed", { error: msg });
      Alert.alert("Sign in failed", msg);
    } finally {
      setOauthLoading(null);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: "#11151C",
        },
        topArea: {
          flex: 0.58,
          minHeight: 340,
          overflow: "hidden",
        },
        topBackground: {
          flex: 1,
        },
        topContent: {
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: insets.top + theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
        },
        topHeader: {
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: theme.spacing.md,
        },
        backButton: {
          position: "absolute",
          left: 0,
          top: 0,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
        },
        wordmark: {
          fontSize: 22,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#E9EEF7",
          fontWeight: "700",
        },
        watermark: {
          position: "absolute",
          width: 260,
          height: 260,
          opacity: 0.08,
          alignSelf: "center",
          top: "35%",
        },
        bottomPanel: {
          flex: 0.42,
          backgroundColor: "#11151C",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
        },
        title: {
          fontSize: 24,
          fontWeight: "700",
          color: "#E9EEF7",
        },
        subtitle: {
          marginTop: theme.spacing.xs,
          color: "#8B94A7",
        },
        error: {
          marginTop: theme.spacing.sm,
          color: theme.colors.danger,
        },
        form: {
          marginTop: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        input: {
          backgroundColor: "#0E1218",
          color: "#E9EEF7",
          borderRadius: 14,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          fontSize: 16,
        },
        inputWithIcon: {
          paddingRight: 48,
        },
        eyeButton: {
          position: "absolute",
          right: 14,
          top: 0,
          bottom: 0,
          justifyContent: "center",
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: theme.spacing.xs,
        },
        remember: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        checkbox: {
          width: 18,
          height: 18,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.3)",
          alignItems: "center",
          justifyContent: "center",
        },
        checkboxChecked: {
          backgroundColor: accent,
          borderColor: accent,
        },
        link: {
          color: accent,
          fontWeight: "600",
          fontSize: 13,
        },
        button: {
          marginTop: theme.spacing.sm,
          backgroundColor: accent,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.md,
        },
        buttonText: {
          color: "#08130C",
          fontWeight: "700",
          fontSize: 16,
        },
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
        },
        divider: {
          flex: 1,
          height: 1,
          backgroundColor: "rgba(255,255,255,0.08)",
        },
        dividerText: {
          color: "#8B94A7",
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        socialRow: {
          flexDirection: "row",
          gap: theme.spacing.md,
          marginTop: theme.spacing.sm,
        },
        socialButton: {
          flex: 1,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          backgroundColor: "#0E1218",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.md,
        },
        footerRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: theme.spacing.xs,
          marginTop: theme.spacing.lg,
        },
        footerText: {
          color: "#8B94A7",
        },
        footerLink: {
          color: accent,
          fontWeight: "600",
        },
        pinLink: {
          marginTop: theme.spacing.sm,
          textAlign: "center",
          color: "#8B94A7",
        },
      }),
    [accent, insets.top, theme],
  );

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1 }}>
            <View style={styles.topArea}>
              <ImageBackground
                source={require("../../../../assets/auth-texture.png")}
                style={styles.topBackground}
                resizeMode="cover"
              >
                <View style={styles.topContent}>
                  <View style={styles.topHeader}>
                    <Pressable
                      onPress={() => navigation.goBack()}
                      style={({ pressed }) => [
                        styles.backButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Feather name="chevron-left" size={24} color="#E9EEF7" />
                    </Pressable>
                    <AppText style={styles.wordmark}>TAYP</AppText>
                  </View>
                  <Image
                    source={require("../../../../assets/icon.png")}
                    style={styles.watermark}
                    resizeMode="contain"
                  />
                </View>
              </ImageBackground>
            </View>
            <View style={styles.bottomPanel}>
              <AppText style={styles.title}>
                {isLogin ? "Log In" : "Create Account"}
              </AppText>
              <AppText style={styles.subtitle}>
                {isLogin
                  ? "Enter your email and password"
                  : "Enter your email and choose a password"}
              </AppText>
              {menuMessage ? (
                <AppText style={styles.error}>{menuMessage}</AppText>
              ) : null}
              <View style={styles.form}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor="#8B94A7"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
                <View>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#8B94A7"
                    secureTextEntry={secureEntry}
                    style={[styles.input, styles.inputWithIcon]}
                  />
                  <Pressable
                    onPress={() => setSecureEntry((prev) => !prev)}
                    style={({ pressed }) => [
                      styles.eyeButton,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather
                      name={secureEntry ? "eye" : "eye-off"}
                      size={18}
                      color="#8B94A7"
                    />
                  </Pressable>
                </View>
                <View style={styles.row}>
                  <Pressable
                    onPress={() => setRememberMe((prev) => !prev)}
                    style={({ pressed }) => [
                      styles.remember,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                      ]}
                    >
                      {rememberMe ? (
                        <Feather name="check" size={12} color="#08130C" />
                      ) : null}
                    </View>
                    <AppText style={{ color: "#8B94A7", fontSize: 13 }}>
                      Remember me
                    </AppText>
                  </Pressable>
                  {isLogin ? (
                    <Pressable
                      onPress={() =>
                        Alert.alert(
                          "Reset password",
                          "Password reset is coming soon.",
                        )
                      }
                    >
                      <AppText style={styles.link}>Forgot password</AppText>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={handleSubmit}
                >
                  <AppText style={styles.buttonText}>
                    {isLogin ? "Log In" : "Sign Up"}
                  </AppText>
                </Pressable>
                {isLogin ? (
                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <AppText style={styles.dividerText}>or</AppText>
                    <View style={styles.divider} />
                  </View>
                ) : null}
                {isLogin ? (
                  <View style={styles.socialRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.socialButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      disabled={!!oauthLoading}
                      onPress={() => handleOAuth("apple")}
                    >
                      {oauthLoading === "apple" ? (
                        <ActivityIndicator color="#E9EEF7" />
                      ) : (
                        <FontAwesome name="apple" size={20} color="#E9EEF7" />
                      )}
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.socialButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      disabled={!!oauthLoading}
                      onPress={() => handleOAuth("google")}
                    >
                      {oauthLoading === "google" ? (
                        <ActivityIndicator color="#E9EEF7" />
                      ) : (
                        <FontAwesome name="google" size={18} color="#E9EEF7" />
                      )}
                    </Pressable>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => {
                    setAuthPage(isLogin ? 1 : 0);
                    setMenuMessage("");
                  }}
                  style={({ pressed }) => [
                    styles.footerRow,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <AppText style={styles.footerText}>
                    {isLogin
                      ? "Don’t have an account?"
                      : "Already have an account?"}
                  </AppText>
                  <AppText style={styles.footerLink}>
                    {isLogin ? "Sign up" : "Log in"}
                  </AppText>
                </Pressable>
                {isLogin ? (
                  <Pressable
                    onPress={() => navigation.navigate("pinVerification")}
                  >
                    <AppText style={styles.pinLink}>Use PIN instead</AppText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
