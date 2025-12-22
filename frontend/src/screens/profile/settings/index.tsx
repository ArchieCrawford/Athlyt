import { Alert, Linking, Pressable, StyleSheet, Switch, View } from "react-native";
import { useState } from "react";
import type { ReactNode } from "react";
import { Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { supabase } from "../../../../supabaseClient";
import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import Button from "../../../components/ui/Button";
import Divider from "../../../components/ui/Divider";
import { useTheme } from "../../../theme/useTheme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";

type RowProps = {
  label: string;
  value?: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress?: () => void;
  tint?: "default" | "danger";
  rightSlot?: ReactNode;
};

function SettingsRow({ label, value, icon, onPress, tint = "default", rightSlot }: RowProps) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface2,
      gap: theme.spacing.sm,
    },
    label: {
      flex: 1,
      color: tint === "danger" ? theme.colors.danger : theme.colors.text,
    },
    value: {
      color: theme.colors.textMuted,
      marginLeft: theme.spacing.sm,
    },
  });

  const content = (
    <>
      {icon ? <Feather name={icon} size={18} color={theme.colors.textMuted} /> : null}
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>
      {value ? <AppText variant="caption" style={styles.value}>{value}</AppText> : null}
      {rightSlot}
      {onPress ? (
        <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

export default function SettingsAndPrivacyScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useSelector((state: RootState) => state.auth.currentUser);
  const [privateAccount, setPrivateAccount] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete account", "This feature is coming soon.");
  };

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert("Unable to open settings", "Open system settings manually.");
    });
  };

  return (
    <Screen scroll>
      <AppText variant="title">Settings and privacy</AppText>
      <AppText variant="muted" style={{ marginTop: theme.spacing.sm }}>
        Manage account and privacy controls.
      </AppText>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <AppText variant="subtitle">Account</AppText>
        <SettingsRow
          label="Email"
          value={user?.email ?? "Not set"}
          icon="mail"
        />
        <SettingsRow label="Phone" value="Not set" icon="phone" />
        <SettingsRow
          label="Change password"
          icon="lock"
          onPress={() => navigation.navigate("changePassword")}
        />
        <SettingsRow
          label="Delete account"
          icon="trash-2"
          tint="danger"
          onPress={handleDeleteAccount}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <AppText variant="subtitle">Privacy</AppText>
        <SettingsRow
          label="Private account"
          icon="shield"
          rightSlot={
            <Switch
              value={privateAccount}
              onValueChange={setPrivateAccount}
              trackColor={{
                false: theme.colors.surface2,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.text}
            />
          }
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <AppText variant="subtitle">Security & permissions</AppText>
        <SettingsRow label="Camera" icon="camera" onPress={openSettings} />
        <SettingsRow label="Microphone" icon="mic" onPress={openSettings} />
        <SettingsRow label="Photos" icon="image" onPress={openSettings} />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <AppText variant="subtitle">Legal</AppText>
        <SettingsRow
          label="Terms of Service"
          icon="file-text"
          onPress={() => navigation.navigate("LegalTerms")}
        />
        <SettingsRow
          label="Privacy Policy"
          icon="shield"
          onPress={() => navigation.navigate("LegalPrivacy")}
        />
        <SettingsRow
          label="Community Guidelines"
          icon="users"
          onPress={() => navigation.navigate("LegalCommunity")}
        />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Divider />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <Button title="Log out" variant="ghost" onPress={handleLogout} />
      </View>
    </Screen>
  );
}
