import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/useTheme";
import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";

export default function SoundPickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    placeholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    text: {
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={theme.colors.text} />
        </Pressable>
        <AppText variant="subtitle">Add sound</AppText>
      </View>
      <View style={styles.placeholder}>
        <Feather name="music" size={40} color={theme.colors.textMuted} />
        <AppText variant="body" style={styles.text}>
          Sound selection is coming soon.
        </AppText>
      </View>
    </Screen>
  );
}
