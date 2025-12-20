import { useMemo, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
  TextInputProps,
  TextStyle,
} from "react-native";
import { useTheme } from "../../theme/useTheme";

interface InputProps extends TextInputProps {
  style?: StyleProp<TextStyle>;
}

export default function Input({ style, onFocus, onBlur, ...props }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        input: {
          backgroundColor: theme.colors.surface2,
          color: theme.colors.text,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          fontSize: theme.type.fontSizes.body,
          borderWidth: 1,
          borderColor: focused ? theme.colors.accent : theme.colors.borderSubtle,
        },
      }),
    [focused, theme],
  );

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      selectionColor={theme.colors.accent}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[styles.input, style]}
      {...props}
    />
  );
}
