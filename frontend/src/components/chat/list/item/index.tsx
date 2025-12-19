import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useUser } from "../../../../hooks/useUser";
import styles from "./styles";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../navigation/main";
import { Chat } from "../../../../../types";
import { Avatar } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";

const ChatListItem = ({ chat }: { chat: Chat }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate("chatSingle", { chatId: chat.id })}
    >
      {userData && userData.photoURL ? (
        <Image style={styles.image} source={{ uri: userData.photoURL }} />
      ) : (
        <Avatar.Icon size={60} icon={"account"} />
      )}
      <View style={{ flex: 1 }}>
        {userData && (
          <Text style={styles.userDisplayName}>
            {userData.displayName || userData.email}
          </Text>
        )}
        <Text style={styles.lastMessage}>{chat.lastMessage}</Text>
      </View>
      <Text>
        {lastUpdateLabel}
      </Text>
    </TouchableOpacity>
  );
};

export default ChatListItem;
