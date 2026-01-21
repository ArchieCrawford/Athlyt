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
  showFollow?: boolean;
  liked: boolean;
  likes: number;
  comments: number;
  bookmarks: number;
  sharesLabel?: string;
  bookmarked?: boolean;
  onLike: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onMorePress?: () => void;
  onAvatarPress?: () => void;
  onFollowPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ActionRail({
  avatarUri,
  showFollow = true,
  liked,
  likes,
  comments,
  bookmarks,
  sharesLabel = "Share",
  bookmarked = false,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onMorePress,
  onAvatarPress,
  onFollowPress,
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
        avatarWrap: {
          alignItems: "center",
          justifyContent: "center",
        },
        followBadge: {
          position: "absolute",
          bottom: -6,
          alignSelf: "center",
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 2,
          borderColor: theme.colors.surface,
        },
      }),
    [theme],
  );

  const heartColor = liked ? theme.colors.accent : theme.colors.text;
  const bookmarkColor = bookmarked ? theme.colors.accent : theme.colors.text;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.avatarWrap}>
        <Pressable
          onPress={onAvatarPress}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Avatar size={44} uri={avatarUri} accentRing />
        </Pressable>
        {showFollow ? (
          <Pressable
            onPress={onFollowPress}
            style={({ pressed }) => [
              styles.followBadge,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={12} color={theme.colors.bg} />
          </Pressable>
        ) : null}
      </View>
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
        onPress={onBookmark}
        label={`${bookmarks}`}
        icon={<Feather name="bookmark" size={22} color={bookmarkColor} />}
      />
      <ActionButton
        onPress={onShare}
        label={sharesLabel}
        icon={<Feather name="send" size={22} color={theme.colors.text} />}
      />
      {onMorePress ? (
        <ActionButton
          onPress={onMorePress}
          label="More"
          icon={<Feather name="more-vertical" size={22} color={theme.colors.text} />}
        />
      ) : null}
    </View>
  );
}
