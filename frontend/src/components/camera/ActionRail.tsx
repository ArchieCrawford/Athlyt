import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import AppText from "../ui/AppText";

type ActionRailItem = {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
};

export default function ActionRail({ items }: { items: ActionRailItem[] }) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          gap: theme.spacing.md,
        },
        item: {
          alignItems: "center",
          gap: theme.spacing.xs,
        },
        iconWrapper: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
        iconWrapperActive: {
          borderColor: theme.colors.accent,
        },
        iconWrapperDisabled: {
          opacity: 0.5,
        },
        label: {
          color: theme.colors.textMuted,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          disabled={item.disabled}
          onPress={item.onPress}
          style={({ pressed }) => [
            styles.item,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <View
            style={[
              styles.iconWrapper,
              item.active && styles.iconWrapperActive,
              item.disabled && styles.iconWrapperDisabled,
            ]}
          >
            <Feather
              name={item.icon}
              size={20}
              color={theme.colors.text}
            />
          </View>
          <AppText variant="caption" style={styles.label}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
