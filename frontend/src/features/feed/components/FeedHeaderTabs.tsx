import { Pressable, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../../components/ui/AppText";

export type FeedTabKey = "Following" | "Friends" | "For You";

interface FeedHeaderTabsProps {
  activeTab: FeedTabKey;
  onTabChange: (tab: FeedTabKey) => void;
  onSearchPress: () => void;
  onLivePress?: () => void;
}

const TABS: FeedTabKey[] = ["Following", "Friends", "For You"];

export default function FeedHeaderTabs({
  activeTab,
  onTabChange,
  onSearchPress,
  onLivePress,
}: FeedHeaderTabsProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingTop: insets.top + theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 20,
    },
    liveButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.borderSubtle,
    },
    tabs: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.md,
    },
    tabText: {
      color: theme.colors.textMuted,
    },
    tabTextActive: {
      color: theme.colors.text,
    },
    searchButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [
          styles.liveButton,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={onLivePress}
      >
        <AppText variant="caption">LIVE</AppText>
      </Pressable>
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <Pressable
              key={tab}
              onPress={() => onTabChange(tab)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText
                variant="subtitle"
                style={active ? styles.tabTextActive : styles.tabText}
              >
                {tab}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.searchButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={onSearchPress}
      >
        <Feather name="search" size={20} color={theme.colors.text} />
      </Pressable>
    </View>
  );
}
