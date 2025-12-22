import { Alert, ScrollView, View } from "react-native";
import ProfileNavBar from "../../components/profile/navBar";
import ProfileHeader from "../../components/profile/header";
import ProfilePostList from "../../components/profile/postList";
import { useState, useContext, useEffect } from "react";
import { FeedStackParamList } from "../../navigation/feed/types";
import { CurrentUserProfileItemInViewContext } from "../../navigation/feed/context";
import { useUser } from "../../hooks/useUser";
import { getPostsByUserId } from "../../services/posts";
import { Post } from "../../../types";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import Screen from "../../components/layout/Screen";
import { useTheme } from "../../theme/useTheme";
import ProfileMenuSheet from "../../components/profile/ProfileMenuSheet";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../../supabaseClient";

type ProfileScreenRouteProp =
  | RouteProp<RootStackParamList, "profileOther">
  | RouteProp<HomeStackParamList, "Me">
  | RouteProp<FeedStackParamList, "feedProfile">;

export default function ProfileScreen({
  route,
}: {
  route: ProfileScreenRouteProp;
}) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { initialUserId } = route.params;
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout failed", error.message);
    }
  };

  return (
    <Screen padding={false}>
      <ProfileNavBar user={user} onMenuPress={() => setMenuOpen(true)} />
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
      <ProfileMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { label: "Settings and privacy", icon: "settings", route: "settings" },
          { label: "Saved", icon: "bookmark", route: "Saved" },
          { label: "QR code", icon: "grid", route: "ProfileQr" },
          { label: "Activity center", icon: "activity", route: "ActivityCenter" },
          { label: "Logout", icon: "log-out", onPress: handleLogout },
        ]}
        onSelect={(routeName) =>
          navigation.navigate(routeName as keyof RootStackParamList)
        }
      />
    </Screen>
  );
}
