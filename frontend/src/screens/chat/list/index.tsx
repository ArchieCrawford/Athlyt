import React, { useMemo } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import NavBarGeneral from "../../../components/general/navbar";
import ChatListItem from "../../../components/chat/list/item";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { Chat } from "../../../../types";
import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";
import Avatar from "../../../components/ui/Avatar";
import { Feather } from "@expo/vector-icons";

const ChatScreen = () => {
  const chats = useSelector((state: RootState) => state.chat.list);
  const theme = useTheme();

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

  const renderItem = ({ item }: { item: Chat }) => {
    return <ChatListItem chat={item} />;
  };

  const renderBubble = (label: string, icon?: keyof typeof Feather.glyphMap) => (
    <View style={styles.bubble} key={label}>
      <Avatar size={52} label={label} icon={icon} />
      <AppText variant="caption" style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </View>
  );

  return (
    <Screen padding={false}>
      <View style={styles.headerRow}>
        <AppText variant="subtitle">Inbox</AppText>
        <Pressable style={styles.headerIcon}>
          <Feather name="search" size={20} color={theme.colors.text} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing.xl,
          backgroundColor: theme.colors.bg,
        }}
      >
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
