import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { findOrCreateChat, messagesListener } from "../services/chat";
import { RootState } from "../redux/store";
import { Message } from "../../types";

export const useMessages = (chatId?: string, contactId?: string) => {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const chats = useSelector((state: RootState) => state.chat.list);

  const [chatIdInst, setChatIdInst] = useState(chatId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleMessagesChange = useCallback((items: Message[]) => {
    setMessages(items);
  }, []);

  useEffect(() => {
    if (chatId && chatId !== chatIdInst) {
      setChatIdInst(chatId);
    }
  }, [chatId, chatIdInst]);

  useEffect(() => {
    let listenerInstance: (() => void) | undefined;
    let isMounted = true;

    const ensureChat = async () => {
      if (chatIdInst || !contactId) {
        return;
      }

      const chat = chats.find((item) =>
        item.members.some((member) => member === contactId),
      );

      if (chat) {
        setChatIdInst(chat.id);
        return;
      }

      try {
        const createdChat = await findOrCreateChat(contactId);
        if (isMounted) {
          setChatIdInst(createdChat.id);
          setError(null);
        }
      } catch (error) {
        console.error("Failed to create chat", error);
        if (isMounted) {
          setError(
            error instanceof Error ? error.message : "Unable to open chat.",
          );
        }
      }
    };

    ensureChat();

    if (currentUser != null && chatIdInst) {
      messagesListener(handleMessagesChange, chatIdInst).then((fn) => {
        listenerInstance = fn;
      });
    }

    return () => {
      isMounted = false;
      listenerInstance && listenerInstance();
    };
  }, [handleMessagesChange, currentUser, chatIdInst, contactId, chats]);

  return { messages, chatIdInst, error };
};
