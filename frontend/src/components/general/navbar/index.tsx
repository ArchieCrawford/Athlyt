import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";

interface NavBarGeneralProps {
  title?: string;
  leftButton?: {
    display: boolean;
    name?: keyof typeof Feather.glyphMap;
  };
  rightButton?: {
    display: boolean;
    name?: keyof typeof Feather.glyphMap;
    action?: () => void;
  };
}

export default function NavBarGeneral({
  title = "NavBarGeneral",
  leftButton = { display: true },
  rightButton = { display: false },
}: NavBarGeneralProps) {
  const navigation = useNavigation();
  const theme = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          backgroundColor: theme.colors.bg,
        },
        button: {
          height: 40,
          width: 40,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          flex: 1,
          textAlign: "center",
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => (leftButton.display ? navigation.goBack() : null)}
      >
        {leftButton.display && (
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        )}
      </Pressable>

      <AppText variant="subtitle" style={styles.title}>
        {title}
      </AppText>

      <Pressable
        style={styles.button}
        onPress={() =>
          rightButton.display && rightButton.action
            ? rightButton.action()
            : null
        }
      >
        {rightButton.display && (
          <Feather
            name={rightButton.name}
            size={22}
            color={theme.colors.accent}
          />
        )}
      </Pressable>
    </View>
  );
}
