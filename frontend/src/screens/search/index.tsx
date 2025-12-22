import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import SearchUserItem from "../../components/search/userItem";
import { queryUsersByName } from "../../services/user";
import { queryPostsByDescription } from "../../services/posts";
import { Post, SearchUser } from "../../../types";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/home";

type SearchRouteProp = RouteProp<HomeStackParamList, "Discover">;

type SearchTab = "Top" | "Users" | "Videos";

export default function SearchScreen({ route }: { route?: SearchRouteProp }) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [textInput, setTextInput] = useState(route?.params?.query ?? "");
  const [activeTab, setActiveTab] = useState<SearchTab>("Top");
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [searchPosts, setSearchPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!textInput) {
      setSearchUsers([]);
      setSearchPosts([]);
      return;
    }
    Promise.all([
      queryUsersByName(textInput),
      queryPostsByDescription(textInput),
    ])
      .then(([users, posts]) => {
        setSearchUsers(users);
        setSearchPosts(posts);
      })
      .catch(() => {
        setSearchUsers([]);
        setSearchPosts([]);
      });
  }, [textInput]);

  useEffect(() => {
    if (route?.params?.query) {
      setTextInput(route.params.query);
    }
  }, [route?.params?.query]);

  const topResults = useMemo(() => {
    const users = searchUsers.slice(0, 6).map((item) => ({
      type: "user" as const,
      item,
    }));
    const posts = searchPosts.slice(0, 6).map((item) => ({
      type: "post" as const,
      item,
    }));
    return [...users, ...posts];
  }, [searchPosts, searchUsers]);

  return (
    <Screen padding={false}>
      <View
        style={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Input
          onChangeText={setTextInput}
          placeholder="Search athletes"
          value={textInput}
        />
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
            marginTop: theme.spacing.sm,
          }}
        >
          {(["Top", "Users", "Videos"] as SearchTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <AppText
                variant="caption"
                style={{
                  color:
                    activeTab === tab
                      ? theme.colors.text
                      : theme.colors.textMuted,
                }}
              >
                {tab}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
      {activeTab === "Users" ? (
        <FlatList
          data={searchUsers}
          renderItem={({ item }) => <SearchUserItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
        />
      ) : activeTab === "Videos" ? (
        <FlatList
          data={searchPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
          renderItem={({ item }) => {
            const poster = item.poster_url || item.media?.[1] || item.media?.[0];
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate("userPosts", {
                    creator: item.creator,
                    profile: true,
                  })
                }
                style={({ pressed }) => [
                  {
                    paddingVertical: theme.spacing.md,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <AppText variant="body">{item.description || "Video"}</AppText>
                {poster ? (
                  <AppText
                    variant="caption"
                    style={{ color: theme.colors.textMuted }}
                  >
                    Tap to view creator
                  </AppText>
                ) : null}
              </Pressable>
            );
          }}
        />
      ) : (
        <FlatList
          data={topResults}
          keyExtractor={(item) =>
            item.type === "user" ? `user-${item.item.id}` : `post-${item.item.id}`
          }
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
          renderItem={({ item }) => {
            if (item.type === "user") {
              return <SearchUserItem item={item.item} />;
            }
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate("userPosts", {
                    creator: item.item.creator,
                    profile: true,
                  })
                }
                style={({ pressed }) => [
                  {
                    paddingVertical: theme.spacing.md,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <AppText variant="body">
                  {item.item.description || "Video"}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: theme.colors.textMuted }}
                >
                  Tap to view creator
                </AppText>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}
