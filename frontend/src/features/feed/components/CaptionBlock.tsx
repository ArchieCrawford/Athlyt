import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { useMemo, useState } from "react";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../../components/ui/AppText";

interface CaptionBlockProps {
  username: string;
  text: string;
  style?: StyleProp<ViewStyle>;
  onHashtagPress?: (tag: string) => void;
  onMentionPress?: (handle: string) => void;
}

export default function CaptionBlock({
  username,
  text,
  style,
  onHashtagPress,
  onMentionPress,
}: CaptionBlockProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const shouldTruncate = text.length > 90;

  const tokens = useMemo(() => {
    const parts = text.split(/(\#[\w-]+|@[\w-]+)/g);
    return parts.filter((part) => part.length > 0);
  }, [text]);

  return (
    <View style={[{ gap: theme.spacing.xs }, style]}>
      <AppText variant="subtitle">{username}</AppText>
      {text ? (
        <>
          <AppText
            variant="body"
            style={{ color: theme.colors.text }}
            numberOfLines={expanded ? undefined : 2}
          >
            {tokens.map((part, index) => {
              if (part.startsWith("#")) {
                return (
                  <Text
                    key={`${part}-${index}`}
                    style={{ color: theme.colors.accent }}
                    onPress={() => onHashtagPress?.(part.slice(1))}
                  >
                    {part}
                  </Text>
                );
              }
              if (part.startsWith("@")) {
                return (
                  <Text
                    key={`${part}-${index}`}
                    style={{ color: theme.colors.accent }}
                    onPress={() => onMentionPress?.(part.slice(1))}
                  >
                    {part}
                  </Text>
                );
              }
              return (
                <Text key={`${part}-${index}`} style={{ color: theme.colors.text }}>
                  {part}
                </Text>
              );
            })}
          </AppText>
          {!expanded && shouldTruncate ? (
            <Pressable onPress={() => setExpanded(true)}>
              <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                more
              </AppText>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
