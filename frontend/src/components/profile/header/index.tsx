import { View } from "react-native";
import { RootState } from "../../../redux/store";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/main";
import { useFollowing } from "../../../hooks/useFollowing";
import { Feather } from "@expo/vector-icons";
import { useFollowingMutation } from "../../../hooks/useFollowingMutation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { User } from "../../../types";
import { useTheme } from "../../../theme/useTheme";
import AppText from "../../ui/AppText";
import Button from "../../ui/Button";
import Avatar from "../../ui/Avatar";

/**
 * Renders the header of the user profile and
 * handles all of the actions within it like follow, unfollow and
 * routing to the user settings.
 *
 * @param {Object} props
 * @param {Object} props.user information of the user to display
 * @returns
 */
export default function ProfileHeader({ user }: { user: User }) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const [followersCount, setFollowersCount] = useState(
    user?.followersCount || 0,
  );
  const currentUserId = useSelector(
    (state: RootState) => state.auth.currentUser?.uid,
  );

  useEffect(() => {
    setFollowersCount(user?.followersCount || 0);
  }, [user]);

  const followingData = useFollowing(currentUserId ?? null, user?.uid ?? null);
  const isFollowing = currentUserId && user?.uid && followingData.data
    ? followingData.data
    : false;

  const isFollowingMutation = useFollowingMutation();

  const renderFollowButton = () => {
    if (isFollowing) {
      return (
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Button
            title="Message"
            variant="secondary"
            fullWidth={false}
            onPress={() => {
              if (user?.uid) {
                navigation.navigate("chatSingle", { contactId: user.uid });
              }
            }}
          />
          <Button
            variant="ghost"
            fullWidth={false}
            icon={<Feather name="user-check" size={20} color={theme.colors.text} />}
            onPress={() => {
              if (user?.uid) {
                isFollowingMutation.mutate({
                  otherUserId: user.uid,
                  isFollowing,
                });
                setFollowersCount(followersCount - 1);
              }
            }}
          />
        </View>
      );
    } else {
      return (
        <Button
          title="Follow"
          fullWidth={false}
          onPress={() => {
            if (user?.uid) {
              isFollowingMutation.mutate({
                otherUserId: user.uid,
                isFollowing,
              });
              setFollowersCount(followersCount + 1);
            }
          }}
        />
      );
    }
  };

  return (
    user && (
      <View
        style={{
          paddingVertical: theme.spacing.lg,
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <Avatar
          size={88}
          uri={user.avatar_path ?? user.photoURL}
          label={user.displayName || `@user`}
          accentRing={currentUserId !== user.uid}
        />
        <AppText variant="subtitle">
          {user.displayName || `@user`}
        </AppText>
        {user.username ? (
          <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
            @{user.username}
          </AppText>
        ) : null}
        {user.bio ? (
          <AppText variant="body" style={{ textAlign: "center" }}>
            {user.bio}
          </AppText>
        ) : currentUserId === user.uid ? (
          <Button
            title="Add bio"
            variant="ghost"
            fullWidth={false}
            onPress={() =>
              navigation.navigate("editProfileField", {
                title: "Bio",
                field: "bio",
                value: user.bio || "",
              })
            }
          />
        ) : null}
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.xl,
            marginTop: theme.spacing.sm,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <AppText variant="subtitle">{user.followingCount}</AppText>
            <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
              Following
            </AppText>
          </View>
          <View style={{ alignItems: "center" }}>
            <AppText variant="subtitle">{followersCount}</AppText>
            <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
              Followers
            </AppText>
          </View>
          <View style={{ alignItems: "center" }}>
            <AppText variant="subtitle">{user.likesCount}</AppText>
            <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
              Likes
            </AppText>
          </View>
        </View>
        {currentUserId === user.uid ? (
          <View style={{ gap: theme.spacing.sm, width: "100%" }}>
            <Button
              title="Edit Profile"
              variant="secondary"
              fullWidth={false}
              onPress={() => navigation.navigate("editProfile")}
            />
          </View>
        ) : (
          renderFollowButton()
        )}
      </View>
    )
  );
}
