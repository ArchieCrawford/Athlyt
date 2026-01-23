import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../supabaseClient";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { useTheme } from "../../theme/useTheme";

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (loading) return;
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (updateError) {
      setError(updateError.message || "Failed to update password.");
      return;
    }

    Alert.alert("Password updated", "Your password has been changed.");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <AppText variant="title">Change password</AppText>
        <AppText variant="muted" style={{ marginBottom: theme.spacing.md }}>
          Enter a new password for your account.
        </AppText>

        <TextInput
          placeholder="New password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.borderSubtle }]}
        />
        <TextInput
          placeholder="Confirm password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.borderSubtle }]}
        />

        {error ? (
          <AppText variant="muted" style={{ color: theme.colors.danger, marginTop: theme.spacing.xs }}>
            {error}
          </AppText>
        ) : null}

        <Button
          title={loading ? "Saving..." : "Save password"}
          onPress={handleSave}
          disabled={loading}
          style={{ marginTop: theme.spacing.lg, width: "100%" }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
