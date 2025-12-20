import { useTheme } from "../../theme/useTheme";
import { StyleProp, View, ViewStyle } from "react-native";

interface DividerProps {
  style?: StyleProp<ViewStyle>;
}

export default function Divider({ style }: DividerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    />
  );
}
