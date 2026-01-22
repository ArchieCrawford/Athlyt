import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Screen from "../../../components/layout/Screen";
import AppText from "../../../components/ui/AppText";
import Input from "../../../components/ui/Input";
import Avatar from "../../../components/ui/Avatar";
import { RootStackParamList } from "../../../navigation/main";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";
import {
  changeFollowState,
  getFollowingIds,
  getSuggestedUsers,
  queryUsersByName,
} from "../../../services/user";
import { SearchUser } from "../../../../types";

type QuickAction = {
  id: "invite" | "qr" | "contacts";
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export default function FindFriendsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);

  const [query, setQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUser[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        },
        headerSide: {
          width: 40,
          alignItems: "flex-start",
        },
        title: {
          color: theme.colors.text,
        },
        searchWrap: {
          paddingHorizontal: theme.spacing.lg,
        },
        quickActions: {
          marginTop: theme.spacing.md,
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        },
        quickActionRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
        quickActionText: {
          color: theme.colors.text,
        },
        sectionTitle: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
          color: theme.colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        listContent: {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
        },
        userRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          marginBottom: theme.spacing.sm,
        },
        userMeta: {
          flex: 1,
        },
        username: {
          color: theme.colors.textMuted,
        },
        bio: {
          color: theme.colors.textMuted,
          marginTop: 2,
        },
        followButton: {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: 999,
          backgroundColor: theme.colors.accent,
        },
        followButtonSecondary: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
        followButtonText: {
          color: theme.colors.text,
          fontWeight: theme.type.fontWeights.bold,
        },
        followButtonTextSecondary: {
          color: theme.colors.text,
        },
        emptyState: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.xl,
          gap: theme.spacing.sm,
        },
        emptyText: {
          color: theme.colors.textMuted,
          textAlign: "center",
        },
      }),
    [theme],
  );

  const refreshFollowing = useCallback(async () => {
    const ids = await getFollowingIds();
    setFollowingIds(ids);
  }, []);

  const loadSuggested = useCallback(async () => {
    if (!currentUser?.uid) {
      setSuggestedUsers([]);
      return;
    }
    setLoadingSuggested(true);
    try {
      const users = await getSuggestedUsers(currentUser.uid, followingIds);
      setSuggestedUsers(users);
    } catch (error) {
      console.warn("Failed to load suggested users", error);
      setSuggestedUsers([]);
    } finally {
      setLoadingSuggested(false);
    }
  }, [currentUser?.uid, followingIds]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    refreshFollowing();
  }, [currentUser?.uid, refreshFollowing]);

  useEffect(() => {
    loadSuggested();
  }, [loadSuggested]);

  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    let active = true;
    setLoadingSearch(true);
    queryUsersByName(query)
      .then((users) => {
        if (!active) return;
        const filtered = currentUser?.uid
          ? users.filter((user) => user.uid !== currentUser.uid)
          : users;
        setSearchResults(filtered);
      })
      .catch(() => {
        if (active) {
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingSearch(false);
        }
      });

    return () => {
      active = false;
    };
  }, [query, currentUser?.uid]);

  const handleInvite = async () => {
    if (!currentUser?.uid) {
      Alert.alert("Invite unavailable", "Sign in to invite friends.");
      return;
    }
    const label = currentUser.username || currentUser.displayName || "athlete";
    const deepLink = `tayp://u/${currentUser.uid}`;
    const message = `Add me on Tayp: ${label}\n${deepLink}`;
    try {
      await Share.share({ message });
    } catch (error) {
      Alert.alert("Invite failed", "Unable to open the share sheet.");
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "invite",
      label: "Invite friends",
      icon: "share-2",
      onPress: handleInvite,
    },
    {
      id: "qr",
      label: "Your QR code",
      icon: "grid",
      onPress: () => Alert.alert("QR code", "QR sharing is coming soon."),
    },
    {
      id: "contacts",
      label: "Find contacts",
      icon: "book",
      onPress: () => Alert.alert("Contacts", "Contacts sync is coming soon."),
    },
  ];

  const handleToggleFollow = async (targetId: string) => {
    if (!currentUser?.uid) {
      Alert.alert("Sign in required", "Log in to follow people.");
      return;
    }
    if (targetId === currentUser.uid) {
      return;
    }
    const previousIds = followingIds;
    const wasFollowing = previousIds.includes(targetId);
    const nextIds = wasFollowing
      ? previousIds.filter((id) => id !== targetId)
      : [...previousIds, targetId];
    setFollowingIds(nextIds);

    const success = await changeFollowState({
      otherUserId: targetId,
      isFollowing: wasFollowing,
    });

    if (!success) {
      setFollowingIds(previousIds);
      Alert.alert("Follow failed", "Please try again.");
    }
  };

  const renderUserRow = ({ item }: { item: SearchUser }) => {
    const isFollowing = followingIds.includes(item.uid);
    const handlePress = () =>
      navigation.navigate("profileOther", { initialUserId: item.uid });
    const displayName = item.displayName || item.username || "Athlete";
    const handle = item.username || "user";

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.userRow,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Avatar
          size={48}
          uri={item.avatar_path ?? item.photoURL}
          label={displayName}
        />
        <View style={styles.userMeta}>
          <AppText variant="body">
            {displayName}
          </AppText>
          <AppText variant="caption" style={styles.username}>
            @{handle}
          </AppText>
          {item.bio ? (
            <AppText variant="caption" style={styles.bio} numberOfLines={1}>
              {item.bio}
            </AppText>
          ) : null}
        </View>
        {currentUser?.uid && item.uid !== currentUser.uid ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              handleToggleFollow(item.uid);
            }}
            style={({ pressed }) => [
              styles.followButton,
              isFollowing && styles.followButtonSecondary,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <AppText
              variant="caption"
              style={[
                styles.followButtonText,
                isFollowing && styles.followButtonTextSecondary,
              ]}
            >
              {isFollowing ? "Following" : "Follow"}
            </AppText>
          </Pressable>
        ) : null}
      </Pressable>
    );
  };

  const listData = query ? searchResults : suggestedUsers;
  const listLoading = query ? loadingSearch : loadingSuggested;
  const sectionLabel = query ? "Search results" : "Suggested accounts";

  return (
    <Screen padding={false}>
      <View style={styles.header}>
        <Pressable style={styles.headerSide} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={theme.colors.text} />
        </Pressable>
        <AppText variant="subtitle" style={styles.title}>
          Find friends
        </AppText>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search by name or username"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.quickActionRow,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name={action.icon} size={18} color={theme.colors.text} />
            <AppText variant="body" style={styles.quickActionText}>
              {action.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="caption" style={styles.sectionTitle}>
        {sectionLabel}
      </AppText>

      {listLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText variant="body" style={styles.emptyText}>
            {query
              ? "No users found. Try a different name."
              : "No suggestions yet. Check back soon."}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.uid}
          renderItem={renderUserRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
