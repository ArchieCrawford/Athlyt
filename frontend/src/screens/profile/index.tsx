import { ScrollView, View } from "react-native";
import ProfileNavBar from "../../components/profile/navBar";
import ProfileHeader from "../../components/profile/header";
import ProfilePostList from "../../components/profile/postList";
import { useState, useContext, useEffect } from "react";
import { FeedStackParamList } from "../../navigation/feed/types";
import { CurrentUserProfileItemInViewContext } from "../../navigation/feed/context";
import { useUser } from "../../hooks/useUser";
import { getPostsByUserId } from "../../services/posts";
import { Post } from "../../../types";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { ProfileDrawerParamList } from "../../navigation/profile";
import Screen from "../../components/layout/Screen";
import { useTheme } from "../../theme/useTheme";

type ProfileScreenRouteProp =
  | RouteProp<RootStackParamList, "profileOther">
  | RouteProp<HomeStackParamList, "Me">
  | RouteProp<FeedStackParamList, "feedProfile">
  | RouteProp<ProfileDrawerParamList, "ProfileMain">;

export default function ProfileScreen({
  route,
}: {
  route: ProfileScreenRouteProp;
}) {
  const theme = useTheme();
  const { initialUserId } = route.params;
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  const providerUserId = useContext(CurrentUserProfileItemInViewContext);

  const userQuery = useUser(
    initialUserId ? initialUserId : providerUserId.currentUserProfileItemInView,
  );

  const user = userQuery.data;

  useEffect(() => {
    if (!user) {
      return;
    }

    getPostsByUserId(user?.uid).then((posts) => setUserPosts(posts));
  }, [user]);

  if (!user) {
    return <></>;
  }

  return (
    <Screen padding={false}>
      <ProfileNavBar user={user} />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: theme.spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader user={user} />
        <View style={{ paddingHorizontal: theme.spacing.lg }}>
          <ProfilePostList posts={userPosts} />
        </View>
      </ScrollView>
    </Screen>
  );
}
