import { FlatList, View } from "react-native";
import React from "react";
import NavBarGeneral from "../../../components/general/navbar";
import ChatListItem from "../../../components/chat/list/item";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { Chat } from "../../../../types";
import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";

const ChatScreen = () => {
  const chats = useSelector((state: RootState) => state.chat.list);
  const theme = useTheme();

  const renderItem = ({ item }: { item: Chat }) => {
    return <ChatListItem chat={item} />;
  };

  return (
    <Screen padding={false}>
      <NavBarGeneral leftButton={{ display: false }} title="Direct messages" />
      <FlatList
        data={chats}
        removeClippedSubviews
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.xl,
        }}
        ListEmptyComponent={
          <View style={{ paddingVertical: theme.spacing.lg }}>
            <AppText variant="muted">No messages yet.</AppText>
          </View>
        }
      />
    </Screen>
  );
};

export default ChatScreen;
