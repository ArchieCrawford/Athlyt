import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, FlatList, TextInput, TouchableOpacity, View } from "react-native";
import styles from "./styles";
import ChatSingleItem from "../../../components/chat/single/item";
import { useMessages } from "../../../hooks/useMessages";
import { SafeAreaView } from "react-native-safe-area-context";
import NavBarGeneral from "../../../components/general/navbar";
import { sendMessage } from "../../../services/chat";
import { RootStackParamList } from "../../../navigation/main";
import { RouteProp } from "@react-navigation/native";
import { Message } from "../../../../types";
import { useQueryClient } from "@tanstack/react-query";
import { keys } from "../../../hooks/queryKeys";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import AppText from "../../../components/ui/AppText";
import { useTheme } from "../../../theme/useTheme";

const ChatSingleScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "chatSingle">;
}) => {
  const { chatId, contactId } = route.params;
  const [message, setMessage] = useState("");

  const { messages, chatIdInst, error } = useMessages(chatId, contactId);
  const queryClient = useQueryClient();
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );
  const theme = useTheme();

  const handleMessageSend = async () => {
    if (message.length === 0 || !chatIdInst) {
      return;
    }

    const nextMessage = message;
    setMessage("");
    try {
      await sendMessage(chatIdInst, nextMessage);
      queryClient.invalidateQueries({ queryKey: keys.messages(chatIdInst) });
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: keys.chats(currentUserId) });
      }
    } catch (error) {
      console.error("Failed to send message", error);
      const messageText =
        error instanceof Error ? error.message : "Failed to send message.";
      Alert.alert("Message not sent", messageText);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    return <ChatSingleItem item={item} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavBarGeneral title="Chat" />
      {error ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 12,
          }}
        >
          <AppText variant="subtitle">Chat unavailable</AppText>
          <AppText variant="muted" style={{ textAlign: "center" }}>
            {error}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
        />
      )}
      <View style={styles.containerInput}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Send Message..."
          style={styles.input}
          editable={!error}
          placeholderTextColor={error ? theme.colors.textMuted : undefined}
        />
        <TouchableOpacity
          onPress={handleMessageSend}
          disabled={!!error || message.length === 0}
          style={{ opacity: error || message.length === 0 ? 0.5 : 1 }}
        >
          <Ionicons name="arrow-up-circle" size={34} color={"crimson"} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChatSingleScreen;
