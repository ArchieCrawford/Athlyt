import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import AppText from "../ui/AppText";

type MenuItem = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
};

interface ProfileMenuSheetProps {
  visible: boolean;
  items: MenuItem[];
  onClose: () => void;
  onSelect: (route: string) => void;
}

export default function ProfileMenuSheet({
  visible,
  items,
  onClose,
  onSelect,
}: ProfileMenuSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.round(width * 0.8);
  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.setValue(panelWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (shouldRender) {
      Animated.timing(translateX, {
        toValue: panelWidth,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [panelWidth, shouldRender, translateX, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          visible && Math.abs(gesture.dx) > 6 && Math.abs(gesture.dy) < 10,
        onPanResponderMove: (_event, gesture) => {
          const nextX = Math.min(panelWidth, Math.max(0, gesture.dx));
          translateX.setValue(nextX);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx > panelWidth * 0.25) {
            onClose();
            return;
          }
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, panelWidth, translateX, visible],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0, 0, 0, 0.45)",
        },
        panel: {
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: panelWidth,
          backgroundColor: theme.colors.surface,
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
        },
        item: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        },
        itemText: {
          flex: 1,
        },
      }),
    [insets.bottom, insets.top, panelWidth, theme],
  );

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {items.map((item) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [
              styles.item,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              onSelect(item.route);
              onClose();
            }}
          >
            <Feather name={item.icon} size={20} color={theme.colors.text} />
            <AppText variant="body" style={styles.itemText}>
              {item.label}
            </AppText>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}
