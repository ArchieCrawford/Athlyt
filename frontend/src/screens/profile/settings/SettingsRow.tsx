import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../theme/useTheme";

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  rightSlot?: ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
};

export default function SettingsRow({
  label,
  value,
  onPress,
  rightSlot,
  destructive = false,
  showChevron = true,
}: SettingsRowProps) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E5E5",
      backgroundColor: "#ffffff",
      gap: theme.spacing.sm,
    },
    label: {
      flex: 1,
      color: destructive ? "#D9392B" : "#111111",
      fontSize: 16,
    },
    value: {
      color: "#6B6B6B",
      fontSize: 14,
    },
  });

  const content = (
    <>
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {rightSlot}
      {onPress && showChevron ? (
        <Feather name="chevron-right" size={18} color="#6B6B6B" />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}
