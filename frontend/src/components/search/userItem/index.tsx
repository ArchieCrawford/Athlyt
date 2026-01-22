import React, { useMemo } from "react";
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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          marginBottom: theme.spacing.sm,
        },
      }),
    [theme],
  );

  const displayName = item.displayName || item.username || "Athlete";
  const handle = item.username ? `@${item.username}` : "@athlete";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={() =>
        navigation.navigate("profileOther", { initialUserId: item?.uid ?? "" })
      }
    >
      <View style={{ flex: 1 }}>
        <AppText variant="body">{displayName}</AppText>
        <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
          {handle}
        </AppText>
      </View>
      <Avatar
        size={40}
        uri={item.avatar_path ?? item.photoURL}
        label={displayName}
      />
    </Pressable>
  );
}
