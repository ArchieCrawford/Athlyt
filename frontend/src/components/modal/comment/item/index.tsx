import React from "react";
import { View, Text, Image } from "react-native";
import { useUser } from "../../../../hooks/useUser";
import { generalStyles } from "../../../../styles";
import styles from "./styles";
import { Comment } from "../../../../../types";
import { Avatar } from "react-native-paper";
import { getMediaPublicUrl } from "../../../../utils/mediaUrls";

const CommentItem = ({ item }: { item: Comment }) => {
  const user = useUser(item.creator).data;
  const displayName = user?.displayName || user?.username || "Athlete";

  return (
    <View style={styles.container}>
      {user && (user.avatar_path || user.photoURL) ? (
        <Image
          style={generalStyles.avatarSmall}
          source={{ uri: getMediaPublicUrl(user.avatar_path ?? user.photoURL) ?? "" }}
        />
      ) : (
        <Avatar.Icon size={32} icon={"account"} />
      )}
      <View style={styles.containerText}>
        {user && (
          <Text style={styles.displayName}>
            {displayName}
          </Text>
        )}
        <Text>{item.comment}</Text>
      </View>
    </View>
  );
};

export default CommentItem;
