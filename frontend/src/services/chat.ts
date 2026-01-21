import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";
import { getBlockedUserIds, isUserBlocked } from "./blocks";
import { Chat, Message } from "../../types";

let chatsChannel: RealtimeChannel | null = null;

export const chatsListener = async (
  listener: (chats: Chat[]) => void,
  userId: string,
) => {
  const loadChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .contains("members", [userId])
      .order("lastUpdate", { ascending: false });

    if (!error && data) {
      let filtered = data as Chat[];
      try {
        const blockedIds = await getBlockedUserIds(userId);
        if (blockedIds.length > 0) {
          filtered = filtered.filter((chat) => {
            const otherMembers = (chat.members || []).filter(
              (member) => member !== userId,
            );
            return !otherMembers.some((member) => blockedIds.includes(member));
          });
        }
      } catch (blockError) {
        console.error("Failed to load blocked users", blockError);
      }
      listener(filtered);
    }
  };

  await loadChats();

  if (chatsChannel) {
    supabase.removeChannel(chatsChannel);
  }

  chatsChannel = supabase
    .channel(`chats-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chats" },
      (payload) => {
        const members =
          (payload.new as Chat | null)?.members ||
          (payload.old as Chat | null)?.members ||
          [];

        if (Array.isArray(members) && members.includes(userId)) {
          loadChats();
        }
      },
    )
    .subscribe();

  return () => {
    if (chatsChannel) {
      supabase.removeChannel(chatsChannel);
      chatsChannel = null;
    }
  };
};

export const messagesListener = async (
  listener: (messages: Message[]) => void,
  chatId: string,
) => {
  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("creation", { ascending: false });

    if (!error && data) {
      listener(data as Message[]);
    }
  };

  await loadMessages();

  const channel = supabase
    .channel(`messages-${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      () => loadMessages(),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const sendMessage = async (chatId: string, message: string) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User is not authenticated");
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("members")
    .eq("id", chatId)
    .single();

  if (chatError) {
    throw chatError;
  }

  const otherMember = (chat?.members || []).find((id) => id !== user.id);
  if (otherMember) {
    const blocked = await isUserBlocked(otherMember, user.id);
    if (blocked) {
      throw new Error("You blocked this user.");
    }
  }

  const { error } = await supabase.from("messages").insert({
    chat_id: chatId,
    creator: user.id,
    message,
    creation: new Date().toISOString(),
  });

  if (error) {
    console.error("Error sending message", error);
    throw error;
  }

  const { error: updateError } = await supabase
    .from("chats")
    .update({
      lastUpdate: new Date().toISOString(),
      lastMessage: message,
    })
    .eq("id", chatId);

  if (updateError) {
    console.error("Error updating chat metadata", updateError);
    throw updateError;
  }
};

export const createChat = async (
  contactId: string,
  currentUserId?: string,
) => {
  try {
    let resolvedUserId = currentUserId;
    if (!resolvedUserId) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("User is not authenticated");
      }
      resolvedUserId = user.id;
    }

    const blocked = await isUserBlocked(contactId, resolvedUserId);
    if (blocked) {
      throw new Error("You blocked this user.");
    }

    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .insert({
        lastUpdate: new Date().toISOString(),
        lastMessage: "",
        members: [contactId, resolvedUserId],
      })
      .select()
      .single();

    if (chatError) {
      throw chatError;
    }

    return chatData;
  } catch (error) {
    console.error("Error creating chat: ", error);
    throw error;
  }
};

export const findChatByMembers = async (
  memberA: string,
  memberB: string,
): Promise<Chat | null> => {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .contains("members", [memberA, memberB])
    .order("lastUpdate", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return (data && data[0] ? (data[0] as Chat) : null);
};

export const findOrCreateChat = async (contactId: string) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("User is not authenticated");
  }

  const blocked = await isUserBlocked(contactId, user.id);
  if (blocked) {
    throw new Error("You blocked this user.");
  }

  const existingChat = await findChatByMembers(user.id, contactId);
  if (existingChat) {
    return existingChat;
  }

  return createChat(contactId, user.id);
};
