import { ReactNode, useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/useTheme";
import AppText from "./AppText";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  title?: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export default function Button({
  title,
  variant = "primary",
  icon,
  fullWidth = true,
  onPress,
  style,
  textStyle,
  disabled = false,
}: ButtonProps) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: theme.spacing.sm,
        },
        primary: {
          backgroundColor: theme.colors.accent,
        },
        secondary: {
          backgroundColor: theme.colors.surface2,
        },
        ghost: {
          backgroundColor: "transparent",
        },
        fullWidth: {
          alignSelf: "stretch",
        },
        iconOnly: {
          paddingHorizontal: theme.spacing.md,
        },
        disabled: {
          opacity: 0.6,
        },
      }),
    [theme],
  );

  const textColor =
    variant === "ghost" ? theme.colors.accent : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        !title && styles.iconOnly,
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        {icon}
        {title ? (
            <AppText
            variant="body"
            style={[
              { color: textColor, fontWeight: theme.type.fontWeights.bold },
              textStyle,
            ]}
          >
            {title}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
