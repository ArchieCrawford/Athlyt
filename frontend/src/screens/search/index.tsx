import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import SearchUserItem from "../../components/search/userItem";
import { queryUsersByEmail } from "../../services/user";
import { SearchUser } from "../../../types";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import { useTheme } from "../../theme/useTheme";

export default function SearchScreen() {
  const theme = useTheme();
  const [textInput, setTextInput] = useState("");
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);

  useEffect(() => {
    queryUsersByEmail(textInput).then((users) => setSearchUsers(users));
  }, [textInput]);

  return (
    <Screen padding={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Input onChangeText={setTextInput} placeholder="Search athletes" />
      </View>
      <FlatList
        data={searchUsers}
        renderItem={({ item }) => <SearchUserItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
      />
    </Screen>
  );
}
