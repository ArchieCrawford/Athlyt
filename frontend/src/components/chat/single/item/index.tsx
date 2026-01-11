import React from "react";
import { View, Text, Image } from "react-native";
import { useUser } from "../../../../hooks/useUser";
import { generalStyles } from "../../../../styles";
import styles from "./styles";
import { Message } from "../../../../../types";
import { Avatar } from "react-native-paper";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/store";
import { getMediaPublicUrl } from "../../../../utils/mediaUrls";

const ChatSingleItem = ({ item }: { item: Message }) => {
  const { data: userData, isLoading } = useUser(item.creator);
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );

  if (isLoading) {
    return <></>;
  }

  const isCurrentUser = currentUserId && item.creator === currentUserId;

  return (
    <View
      style={isCurrentUser ? styles.containerCurrent : styles.containerOther}
    >
      {userData && (userData.avatar_path || userData.photoURL) ? (
        <Image
          style={generalStyles.avatarSmall}
          source={{
            uri: getMediaPublicUrl(userData.avatar_path ?? userData.photoURL) ?? "",
          }}
        />
      ) : (
        <Avatar.Icon size={32} icon={"account"} />
      )}
      <View
        style={
          isCurrentUser
            ? styles.containerTextCurrent
            : styles.containerTextOther
        }
      >
        <Text style={styles.text}>{item.message}</Text>
      </View>
    </View>
  );
};

export default ChatSingleItem;
