import React, { useState } from "react";
import { Alert, View, TextInput } from "react-native";
import Button from "../../components/ui/Button";
import Screen from "../../components/layout/Screen";
import { useTheme } from "../../theme/useTheme";
import useAuth from "../../hooks/useAuth";
import { supabase } from "../../../supabaseClient";

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onUpdate = async () => {
    if (!password.trim()) {
      Alert.alert("Password required", "Please enter a new password.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please confirm your new password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      Alert.alert("Update failed", error.message);
      return;
    }
    Alert.alert("Password updated", "Please sign in again.");
    await signOut();
  };

  return (
    <Screen padding style={{ gap: theme.spacing.md }}>
      <TextInput
        secureTextEntry
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
        style={{
          backgroundColor: theme.colors.surface2,
          color: theme.colors.text,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        }}
      />
      <TextInput
        secureTextEntry
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{
          backgroundColor: theme.colors.surface2,
          color: theme.colors.text,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        }}
      />
      <Button title={loading ? "Updating..." : "Update Password"} onPress={onUpdate} disabled={loading} />
    </Screen>
  );
}
