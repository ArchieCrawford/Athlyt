import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import ChatListItem from "../../../components/chat/list/item";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { Chat, SearchUser } from "../../../../types";
import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";
import Input from "../../../components/ui/Input";
import Avatar from "../../../components/ui/Avatar";
import { useQuery } from "@tanstack/react-query";
import { queryUsersByName } from "../../../services/user";
import { findOrCreateChat } from "../../../services/chat";
import { keys } from "../../../hooks/queryKeys";

const ChatScreen = () => {
  const chats = useSelector((state: RootState) => state.chat.list);
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerQuery, setComposerQuery] = useState("");
  const [creatingChat, setCreatingChat] = useState(false);

  const trimmedQuery = composerQuery.trim();
  const { data: searchResults = [], isFetching: searchLoading } = useQuery({
    queryKey: keys.userSearch(trimmedQuery, currentUserId ?? ""),
    queryFn: () =>
      queryUsersByName(trimmedQuery, currentUserId ? [currentUserId] : []),
    enabled: composerOpen && trimmedQuery.length > 0,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.md,
          position: "relative",
        },
        headerIcon: {
          position: "absolute",
          right: theme.spacing.lg,
        },
        composerCard: {
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          gap: theme.spacing.sm,
        },
        composerHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        userRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
        bubblesRow: {
          flexDirection: "row",
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
        bubble: {
          width: 64,
          alignItems: "center",
          gap: theme.spacing.xs,
        },
        sections: {
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        },
        sectionRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.md,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.borderSubtle,
        },
        emptyCard: {
          marginTop: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface2,
          alignItems: "center",
          gap: theme.spacing.xs,
        },
      }),
    [theme],
  );

  const handleNewMessageToggle = () => {
    setComposerOpen((prev) => {
      if (prev) {
        setComposerQuery("");
      }
      return !prev;
    });
  };

  const handleStartChat = async (user: SearchUser) => {
    if (!user?.uid) {
      return;
    }
    setCreatingChat(true);
    try {
      const chat = await findOrCreateChat(user.uid);
      setComposerOpen(false);
      setComposerQuery("");
      navigation.navigate("chatSingle", { chatId: chat.id, contactId: user.uid });
    } catch (error) {
      console.error("Failed to start chat", error);
    } finally {
      setCreatingChat(false);
    }
  };

  const renderItem = ({ item }: { item: Chat }) => {
    return <ChatListItem chat={item} />;
  };

  const renderBubble = (label: string, icon?: keyof typeof Feather.glyphMap) => (
    <View style={styles.bubble} key={label}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.surface2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon ? (
          <Feather name={icon} size={22} color={theme.colors.text} />
        ) : (
          <AppText variant="body">
            {label.slice(0, 2).toUpperCase()}
          </AppText>
        )}
      </View>
      <AppText variant="caption" style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </View>
  );

  return (
    <Screen padding={false}>
      <View style={styles.headerRow}>
        <AppText variant="subtitle">Inbox</AppText>
        <Pressable style={styles.headerIcon} onPress={handleNewMessageToggle}>
          <Feather name="edit-3" size={20} color={theme.colors.text} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing.xl,
          backgroundColor: theme.colors.bg,
        }}
      >
        {composerOpen ? (
          <View style={styles.composerCard}>
            <View style={styles.composerHeader}>
              <AppText variant="subtitle">New Message</AppText>
              {creatingChat ? (
                <ActivityIndicator color={theme.colors.textMuted} />
              ) : null}
            </View>
            <Input
              value={composerQuery}
              onChangeText={setComposerQuery}
              placeholder="Search users"
            />
            {trimmedQuery.length === 0 ? (
              <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                Start typing to find someone.
              </AppText>
            ) : searchLoading ? (
              <ActivityIndicator color={theme.colors.textMuted} />
            ) : searchResults.length === 0 ? (
              <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
                No users found.
              </AppText>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {searchResults.map((user) => (
                  <Pressable
                    key={user.id}
                    style={({ pressed }) => [
                      styles.userRow,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleStartChat(user)}
                  >
                    <Avatar
                      size={44}
                      uri={user.avatar_path ?? user.photoURL}
                      label={user.displayName || user.email}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="body">
                        {user.displayName || user.email}
                      </AppText>
                      {user.username ? (
                        <AppText
                          variant="caption"
                          style={{ color: theme.colors.textMuted }}
                        >
                          @{user.username}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.bubblesRow}>
          {renderBubble("Create", "plus")}
          {renderBubble("Contacts")}
          {renderBubble("Recent")}
          {renderBubble("More")}
        </View>

        <View style={styles.sections}>
          <Pressable style={styles.sectionRow}>
            <AppText variant="body">New followers</AppText>
            <Feather name="chevron-right" size={18} color={theme.colors.text} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.sectionRow}>
            <AppText variant="body">Activity</AppText>
            <Feather name="chevron-right" size={18} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.md }}>
          <AppText variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
            Messages
          </AppText>
          {chats.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppText variant="body">No messages yet</AppText>
              <AppText variant="muted" style={{ textAlign: "center" }}>
                When someone messages you, you’ll see it here.
              </AppText>
            </View>
          ) : (
            <FlatList
              data={chats}
              removeClippedSubviews
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
              contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

export default ChatScreen;
