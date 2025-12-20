import { StyleProp, View, ViewStyle } from "react-native";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../../components/ui/AppText";

interface CaptionBlockProps {
  username: string;
  caption: string;
  tags?: string[];
  style?: StyleProp<ViewStyle>;
}

export default function CaptionBlock({
  username,
  caption,
  tags = [],
  style,
}: CaptionBlockProps) {
  const theme = useTheme();

  return (
    <View style={[{ gap: theme.spacing.xs }, style]}>
      <AppText variant="subtitle">{username}</AppText>
      {caption ? (
        <AppText variant="body" style={{ color: theme.colors.text }}>
          {caption}
        </AppText>
      ) : null}
      {tags.length > 0 ? (
        <AppText variant="caption" style={{ color: theme.colors.accent }}>
          {tags.join(" ")}
        </AppText>
      ) : null}
    </View>
  );
}
