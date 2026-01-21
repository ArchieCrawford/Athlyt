import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import AppText from "../ui/AppText";
import { createReport, ReportTargetType } from "../../services/reports";

const REASONS = [
  "Spam",
  "Harassment",
  "Hate speech",
  "Violence",
  "Nudity",
  "Scam",
  "Other",
];

export default function ReportSheet({
  visible,
  targetType,
  targetId,
  onClose,
  title,
}: {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  title?: string;
}) {
  const theme = useTheme();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDetails("");
      setSubmitting(false);
    }
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          gap: theme.spacing.md,
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        reasonRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
        reasonText: {
          color: theme.colors.text,
        },
        reasonSelected: {
          color: theme.colors.accent,
          fontWeight: theme.type.fontWeights.bold,
        },
        input: {
          minHeight: 90,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          color: theme.colors.text,
          padding: theme.spacing.md,
          textAlignVertical: "top",
        },
        submitButton: {
          marginTop: theme.spacing.xs,
          backgroundColor: theme.colors.accent,
          borderRadius: 14,
          paddingVertical: theme.spacing.md,
          alignItems: "center",
        },
        submitText: {
          color: theme.colors.bg,
          fontWeight: theme.type.fontWeights.bold,
        },
        helper: {
          color: theme.colors.textMuted,
        },
      }),
    [theme],
  );

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert("Select a reason", "Please choose a reason to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details: details.trim() ? details.trim() : undefined,
      });
      Alert.alert("Report submitted", "Thanks for letting us know.");
      onClose();
    } catch (error) {
      console.error("Failed to submit report", error);
      Alert.alert("Report failed", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.headerRow}>
            <AppText variant="subtitle">
              {title ?? `Report ${targetType}`}
            </AppText>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <AppText variant="muted" style={styles.helper}>
            Select a reason. Your report helps keep Tayp safe.
          </AppText>
          {REASONS.map((item) => {
            const selected = item === reason;
            return (
              <Pressable
                key={item}
                style={styles.reasonRow}
                onPress={() => setReason(item)}
              >
                <AppText
                  style={[styles.reasonText, selected && styles.reasonSelected]}
                >
                  {item}
                </AppText>
                {selected ? (
                  <Feather name="check" size={18} color={theme.colors.accent} />
                ) : null}
              </Pressable>
            );
          })}
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Optional details"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              { opacity: pressed || submitting ? 0.8 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <AppText style={styles.submitText}>Submit report</AppText>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
