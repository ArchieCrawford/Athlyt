import React, { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Screen from "../../../components/layout/Screen";
import NavBarGeneral from "../../../components/general/navbar";
import AppText from "../../../components/ui/AppText";
import Button from "../../../components/ui/Button";
import { saveUserProfileImage, removeUserProfileImage } from "../../../services/user";
import { RootState } from "../../../redux/store";
import { useTheme } from "../../../theme/useTheme";
import { RootStackParamList } from "../../../navigation/main";

export default function EditProfileScreen() {
  const theme = useTheme();
  const auth = useSelector((state: RootState) => state.auth);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const user = auth.currentUser;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
        section: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        sectionTitle: {
          color: theme.colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        avatarCard: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        avatarCircle: {
          height: 110,
          width: 110,
          borderRadius: 55,
          backgroundColor: theme.colors.surface2,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        avatarImage: {
          position: "absolute",
          width: 110,
          height: 110,
        },
        avatarOverlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.35)",
        },
        avatarLabel: {
          color: theme.colors.text,
          fontSize: theme.type.fontSizes.caption,
        },
        banner: {
          marginHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        bannerIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.surface,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
        rowLabel: {
          color: theme.colors.text,
        },
        rowValue: {
          color: theme.colors.textMuted,
        },
        rowRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
          maxWidth: "60%",
        },
        rowValueText: {
          color: theme.colors.textMuted,
          textAlign: "right",
        },
        actionRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
        },
      }),
    [theme],
  );

  const openSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert("Unable to open settings", "Open system settings manually.");
    });
  };

  const handleLibraryPick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const granted = permission.granted || permission.status === "granted";
    if (!granted) {
      Alert.alert(
        "Photos permission required",
        "Enable Photos access in Settings to select a profile photo.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openSettings },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsUpdatingAvatar(true);
      saveUserProfileImage(result.assets[0].uri)
        .catch((error) => {
          Alert.alert("Update failed", error?.message || "Unable to save photo.");
        })
        .finally(() => setIsUpdatingAvatar(false));
    }
  };

  const handleCameraPick = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    const granted = permission.granted || permission.status === "granted";
    if (!granted) {
      Alert.alert(
        "Camera permission required",
        "Enable Camera access in Settings to take a profile photo.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openSettings },
        ],
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsUpdatingAvatar(true);
      saveUserProfileImage(result.assets[0].uri)
        .catch((error) => {
          Alert.alert("Update failed", error?.message || "Unable to save photo.");
        })
        .finally(() => setIsUpdatingAvatar(false));
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUpdatingAvatar(true);
    removeUserProfileImage()
      .catch((error) => {
        Alert.alert("Remove failed", error?.message || "Unable to remove photo.");
      })
      .finally(() => setIsUpdatingAvatar(false));
  };

  const openAvatarActions = () => {
    const options = ["Take Photo", "Choose From Library"];
    const removeIndex = user?.photoURL ? options.push("Remove") - 1 : -1;
    const cancelButtonIndex = options.push("Cancel") - 1;
    const destructiveButtonIndex = removeIndex;

    const handleAction = (index: number) => {
      if (index === 0) {
        handleCameraPick();
      } else if (index === 1) {
        handleLibraryPick();
      } else if (index === removeIndex) {
        handleRemoveAvatar();
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex: destructiveButtonIndex >= 0
            ? destructiveButtonIndex
            : undefined,
        },
        handleAction,
      );
      return;
    }

    const actions = [
      { text: "Take Photo", onPress: handleCameraPick },
      { text: "Choose From Library", onPress: handleLibraryPick },
    ];
    if (user?.photoURL) {
      actions.push({
        text: "Remove",
        style: "destructive" as const,
        onPress: handleRemoveAvatar,
      });
    }
    actions.push({ text: "Cancel", style: "cancel" as const });
    Alert.alert("Edit photo", "Choose an option", actions);
  };

  const navigateToField = (
    title: string,
    field: string,
    value: string,
    options?: { maxLength?: number; multiline?: boolean },
  ) => {
    navigation.navigate("editProfileField", {
      title,
      field,
      value,
      maxLength: options?.maxLength,
      multiline: options?.multiline,
    });
  };

  const profileRows = [
    {
      label: "Name",
      field: "displayName",
      value: user?.displayName ?? "",
      placeholder: "Add name",
      maxLength: 40,
    },
    {
      label: "Username",
      field: "username",
      value: user?.username ?? "",
      placeholder: "Add username",
      maxLength: 24,
    },
    {
      label: "Bio",
      field: "bio",
      value: user?.bio ?? "",
      placeholder: "Add bio",
      maxLength: 100,
      multiline: true,
    },
    {
      label: "Pronoun",
      field: "pronoun",
      value: user?.pronoun ?? "",
      placeholder: "Add pronoun",
      maxLength: 24,
    },
    {
      label: "Links",
      field: "links",
      value: user?.links ?? "",
      placeholder: "Add link",
      maxLength: 120,
    },
    {
      label: "College",
      field: "college",
      value: user?.college ?? "",
      placeholder: "Add college",
      maxLength: 60,
    },
  ];

  const otherRows = [
    { label: "Fundraiser" },
    { label: "AI self" },
  ];

  return (
    <Screen scroll padding={false} style={{ backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <NavBarGeneral title="Edit profile" />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.banner,
          { opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => navigation.navigate("avatarCreator")}
      >
        <View style={styles.bannerIcon}>
          <Feather name="smile" size={20} color={theme.colors.text} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="body">Create your avatar</AppText>
          <AppText variant="caption" style={{ color: theme.colors.textMuted }}>
            Try a new look in a few taps.
          </AppText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
      </Pressable>

      <View style={styles.avatarCard}>
        <Pressable
          onPress={openAvatarActions}
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
        >
          <View style={styles.avatarCircle}>
            {user?.photoURL ? (
              <Image style={styles.avatarImage} source={{ uri: user.photoURL }} />
            ) : (
              <Feather name="user" size={44} color={theme.colors.textMuted} />
            )}
            <View style={styles.avatarOverlay} />
            {isUpdatingAvatar ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <Feather name="camera" size={24} color={theme.colors.text} />
            )}
          </View>
        </Pressable>
        <AppText variant="caption" style={styles.avatarLabel}>
          Edit photo or avatar
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" style={styles.sectionTitle}>
          Profile info
        </AppText>
        {profileRows.map((row) => (
          <Pressable
            key={row.field}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() =>
              navigateToField(row.label, row.field, row.value, {
                maxLength: row.maxLength,
                multiline: row.multiline,
              })
            }
          >
            <AppText variant="body" style={styles.rowLabel}>
              {row.label}
            </AppText>
            <View style={styles.rowRight}>
              <AppText variant="body" style={styles.rowValueText} numberOfLines={1}>
                {row.value ? row.value : row.placeholder}
              </AppText>
              <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="caption" style={styles.sectionTitle}>
          Others
        </AppText>
        {otherRows.map((row) => (
          <Pressable
            key={row.label}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() =>
              Alert.alert(row.label, "This section is coming soon.")
            }
          >
            <AppText variant="body" style={styles.rowLabel}>
              {row.label}
            </AppText>
            <View style={styles.rowRight}>
              <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, { paddingBottom: theme.spacing.xl }]}>
        <View style={styles.actionRow}>
          <Button
            title="View profile"
            variant="secondary"
            fullWidth={false}
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </Screen>
  );
}
