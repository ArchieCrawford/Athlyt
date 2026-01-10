import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import AppText from "../ui/AppText";

export type CaptureModeOption = {
  id: string;
  label: string;
};

interface ModeSelectorProps {
  options: CaptureModeOption[];
  value: string;
  onChange: (id: string) => void;
}

export default function ModeSelector({
  options,
  value,
  onChange,
}: ModeSelectorProps) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: theme.spacing.lg,
        },
        item: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: 16,
        },
        itemActive: {
          backgroundColor: theme.colors.surface2,
        },
        text: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        textActive: {
          color: theme.colors.text,
          fontWeight: theme.type.fontWeights.bold,
        },
        row: {
          flexDirection: "row",
          gap: theme.spacing.sm,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [theme],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.container}
    >
      {options.map((option) => {
        const isActive = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={({ pressed }) => [
              styles.item,
              isActive && styles.itemActive,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <AppText
              variant="caption"
              style={[styles.text, isActive && styles.textActive]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
