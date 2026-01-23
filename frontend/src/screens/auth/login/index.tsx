import { useState } from "react";
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
import useAuth from "../../../hooks/useAuth";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import { logAuthEvent } from "../../../services/telemetry";
import { signInWithProvider } from "../../../services/oauth";

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"apple" | "google" | null>(
    null,
  );

  const [isLogin, setIsLogin] = useState(true);
  const [menuMessage, setMenuMessage] = useState("");

  const handleLogin = async () => {
    try {
      await signIn(email.trim(), password);
      setMenuMessage("");
    } catch (err: any) {
      const msg = err?.message || "Login failed.";
      logAuthEvent("login_failed", { error: msg });
      Alert.alert("Login failed", msg);
    }
  };

  const handleRegister = async () => {
    try {
      await signUp(email.trim(), password);
      setMenuMessage("");
    } catch (err: any) {
      const msg = err?.message || "Registration failed.";
      logAuthEvent("signup_failed", { error: msg });
      Alert.alert("Registration failed", msg);
    }
  };

  const handleOAuth = async (provider: "apple" | "google") => {
    if (oauthLoading) return;

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

  return (
    <ImageBackground
      source={require("../../../assets/images/auth-bg.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.logo}
            />
            <AppText variant="h2" style={{ color: theme.colors.text }}>
              TAYP
            </AppText>
            {menuMessage ? (
              <AppText variant="body" style={{ color: theme.colors.textMuted }}>
                {menuMessage}
              </AppText>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.segment}>
              <Pressable
                style={[
                  styles.segmentBtn,
                  isLogin && styles.segmentBtnActive,
                ]}
                onPress={() => setIsLogin(true)}
              >
                <AppText
                  variant="body"
                  style={{
                    color: isLogin ? "#0B0F17" : theme.colors.text,
                    fontWeight: "700",
                  }}
                >
                  Sign In
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.segmentBtn,
                  !isLogin && styles.segmentBtnActive,
                ]}
                onPress={() => setIsLogin(false)}
              >
                <AppText
                  variant="body"
                  style={{
                    color: !isLogin ? "#0B0F17" : theme.colors.text,
                    fontWeight: "700",
                  }}
                >
                  Register
                </AppText>
              </Pressable>
            </View>

            <View style={styles.field}>
              <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                Email
              </AppText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@email.com"
                placeholderTextColor="#7C8798"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                Password
              </AppText>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureEntry}
                  placeholder="••••••••"
                  placeholderTextColor="#7C8798"
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  onPress={() => setSecureEntry((p) => !p)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={secureEntry ? "eye" : "eye-off"}
                    size={18}
                    color="#AAB3C2"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.row}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRememberMe((p) => !p)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxOn]} />
                <AppText variant="caption" style={{ color: theme.colors.text }}>
                  Remember me
                </AppText>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={isLogin ? handleLogin : handleRegister}
            >
              <AppText variant="body" style={{ color: "#0B0F17", fontWeight: "800" }}>
                {isLogin ? "Sign In" : "Create Account"}
              </AppText>
            </Pressable>

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  header: { alignItems: "center", gap: 8, marginBottom: 18 },
  logo: { width: 56, height: 56, borderRadius: 14 },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(11,15,23,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  segment: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#E9EEF7",
  },
  field: { marginBottom: 12, gap: 6 },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#E9EEF7",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingRight: 44 },
  eyeBtn: { position: "absolute", right: 12, height: 48, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
  },
  checkboxOn: { backgroundColor: "#E9EEF7", borderColor: "#E9EEF7" },
  primaryBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#E9EEF7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  socialRow: { flexDirection: "row", gap: 10, marginTop: 12, justifyContent: "center" },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
