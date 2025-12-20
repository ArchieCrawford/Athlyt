import { ReactNode, useMemo } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../../components/ui/AppText";
import Avatar from "../../../components/ui/Avatar";

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: "center",
          gap: theme.spacing.xs,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon}
      <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface ActionRailProps {
  avatarUri?: string;
  liked: boolean;
  likes: number;
  comments: number;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ActionRail({
  avatarUri,
  liked,
  likes,
  comments,
  onLike,
  onComment,
  onShare,
  style,
}: ActionRailProps) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          gap: theme.spacing.lg,
        },
      }),
    [theme],
  );

  const heartColor = liked ? theme.colors.accent : theme.colors.text;

  return (
    <View style={[styles.container, style]}>
      <Avatar size={44} uri={avatarUri} accentRing />
      <ActionButton
        onPress={onLike}
        label={`${likes}`}
        icon={<Feather name="heart" size={24} color={heartColor} />}
      />
      <ActionButton
        onPress={onComment}
        label={`${comments}`}
        icon={<Feather name="message-circle" size={24} color={theme.colors.text} />}
      />
      <ActionButton
        onPress={onShare}
        label="Share"
        icon={<Feather name="send" size={22} color={theme.colors.text} />}
      />
    </View>
  );
}
