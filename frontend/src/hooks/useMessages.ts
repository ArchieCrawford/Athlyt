import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { createChat, messagesListener } from "../services/chat";
import { RootState } from "../redux/store";
import { Message } from "../../types";

export const useMessages = (chatId?: string, contactId?: string) => {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const chats = useSelector((state: RootState) => state.chat.list);

  const [chatIdInst, setChatIdInst] = useState(chatId);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleMessagesChange = useCallback((items: Message[]) => {
    setMessages(items);
  }, []);

  useEffect(() => {
    let listenerInstance: (() => void) | undefined;

    if (!chatIdInst) {
      let chat = chats.find((item) =>
        item.members.some((member) => member === contactId),
      );

      if (!chat && contactId) {
        createChat(contactId).then((res) => setChatIdInst(res.id));
      } else if (chat) {
        setChatIdInst(chat.id);
      }
    }

    if (currentUser != null && chatIdInst) {
      messagesListener(handleMessagesChange, chatIdInst).then((fn) => {
        listenerInstance = fn;
      });
    }

    return () => {
      listenerInstance && listenerInstance();
    };
  }, [handleMessagesChange, currentUser, chatIdInst]);

  return { messages, chatIdInst };
};
