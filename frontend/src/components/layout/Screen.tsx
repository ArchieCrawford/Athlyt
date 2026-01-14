import { ReactNode } from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";

interface ScreenProps {
  children: ReactNode;
  fullBleed?: boolean;
  scroll?: boolean;
  padding?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeAreaEdges?: Edge[];
}

export default function Screen({
  children,
  fullBleed = false,
  scroll = false,
  padding = true,
  style,
  contentContainerStyle,
  safeAreaEdges,
}: ScreenProps) {
  const theme = useTheme();
  const paddingStyle = padding
    ? {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
      }
    : null;
  const edges = safeAreaEdges ?? (fullBleed ? ["bottom"] : ["top", "bottom"]);

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: theme.colors.bg }, style]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            { flexGrow: 1 },
            paddingStyle,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, paddingStyle, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
