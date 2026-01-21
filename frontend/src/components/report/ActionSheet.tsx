import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import AppText from "../ui/AppText";

export type ActionSheetItem = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

export default function ActionSheet({
  visible,
  onClose,
  title,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionSheetItem[];
}) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          {title ? (
            <AppText variant="subtitle" style={styles.title}>
              {title}
            </AppText>
          ) : null}
          <View style={styles.items}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <AppText
                  style={[
                    styles.label,
                    item.destructive && { color: theme.colors.danger },
                  ]}
                >
                  {item.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    marginBottom: 12,
  },
  items: {
    gap: 8,
  },
  row: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
  },
});
