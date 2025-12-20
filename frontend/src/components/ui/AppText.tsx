import { ReactNode, useMemo } from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";

type AppTextVariant = "title" | "subtitle" | "body" | "caption" | "muted";

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
}

export default function AppText({
  variant = "body",
  style,
  children,
  ...props
}: AppTextProps) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          color: theme.colors.text,
        },
        title: {
          fontSize: theme.type.fontSizes.title,
          fontWeight: theme.type.fontWeights.heavy,
          letterSpacing: 0.5,
        },
        subtitle: {
          fontSize: theme.type.fontSizes.subtitle,
          fontWeight: theme.type.fontWeights.bold,
          letterSpacing: 0.3,
        },
        body: {
          fontSize: theme.type.fontSizes.body,
          fontWeight: theme.type.fontWeights.regular,
        },
        caption: {
          fontSize: theme.type.fontSizes.caption,
          fontWeight: theme.type.fontWeights.medium,
        },
        muted: {
          fontSize: theme.type.fontSizes.body,
          fontWeight: theme.type.fontWeights.regular,
          color: theme.colors.textMuted,
        },
      }),
    [theme, variant],
  );

  return (
    <Text {...props} style={[styles.base, styles[variant], style]}>
      {children}
    </Text>
  );
}
