import { View, Pressable, StyleSheet } from "react-native";
import React, { useMemo } from "react";
import { useUser } from "../../../../hooks/useUser";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { Chat } from "../../../../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";
import { useTheme } from "../../../../theme/useTheme";
import AppText from "../../../ui/AppText";
import Avatar from "../../../ui/Avatar";

const ChatListItem = ({ chat }: { chat: Chat }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const contactId =
    currentUserId && chat.members[0] === currentUserId
      ? chat.members[1]
      : chat.members[0];
  const { data: userData } = useUser(
    contactId,
  );

  const lastUpdateLabel = chat.lastUpdate
    ? new Date(chat.lastUpdate as any).toLocaleDateString()
    : "Now";

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
        message: {
          color: theme.colors.textMuted,
        },
        timestamp: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
        },
      }),
    [theme],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => navigation.navigate("chatSingle", { chatId: chat.id })}
    >
      <Avatar
        size={56}
        uri={userData?.photoURL}
        label={userData?.displayName || userData?.email}
      />
      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        {userData ? (
          <AppText variant="body">
            {userData.displayName || userData.email}
          </AppText>
        ) : null}
        <AppText variant="caption" style={styles.message} numberOfLines={1}>
          {chat.lastMessage}
        </AppText>
      </View>
      <AppText variant="caption" style={styles.timestamp}>
        {lastUpdateLabel}
      </AppText>
    </Pressable>
  );
};

export default ChatListItem;
