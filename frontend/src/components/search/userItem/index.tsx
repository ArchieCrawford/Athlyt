import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SearchUser } from "../../../../types";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/main";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import Avatar from "../../ui/Avatar";

export default function SearchUserItem({ item }: { item: SearchUser }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          borderBottomColor: theme.colors.borderSubtle,
          backgroundColor: pressed ? theme.colors.surface2 : "transparent",
        },
      ]}
      onPress={() =>
        navigation.navigate("profileOther", { initialUserId: item?.uid ?? "" })
      }
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body">
          {item.displayName || item.email}
        </AppText>
        <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
          @{item.email?.split("@")[0]}
        </AppText>
      </View>
      <Avatar size={40} uri={item.photoURL} label={item.displayName || item.email} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
