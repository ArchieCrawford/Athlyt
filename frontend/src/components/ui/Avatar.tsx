import { useMemo } from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";
import AppText from "./AppText";
import { getMediaPublicUrl } from "../../utils/mediaUrls";

interface AvatarProps {
  size?: number;
  uri?: string;
  label?: string;
  accentRing?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Avatar({
  size = 56,
  uri,
  label,
  accentRing = false,
  style,
}: AvatarProps) {
  const theme = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        ring: {
          width: size + theme.spacing.xs * 2,
          height: size + theme.spacing.xs * 2,
          borderRadius: (size + theme.spacing.xs * 2) / 2,
          borderWidth: accentRing ? 2 : 0,
          borderColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        image: {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        fallback: {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.surface2,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [accentRing, size, theme],
  );

  return (
    <View style={[styles.ring, style]}>
      {uri ? (
        <Image
          key={getMediaPublicUrl(uri) ?? "avatar"}
          style={styles.image}
          source={{ uri: getMediaPublicUrl(uri) ?? uri }}
        />
      ) : (
        <View style={styles.fallback}>
          <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
            {label ? label.slice(0, 2).toUpperCase() : "?"}
          </AppText>
        </View>
      )}
    </View>
  );
}
