import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "uuid-random";
import * as ImagePicker from "expo-image-picker";

import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { RootStackParamList } from "../../navigation/main";
import { HomeStackParamList } from "../../navigation/home";
import { AppDispatch } from "../../redux/store";
import { createPost } from "../../redux/slices/postSlice";
import { logEvent } from "../../services/telemetry";
import { useTheme } from "../../theme/useTheme";

interface SavePostScreenProps {
  route: RouteProp<RootStackParamList, "savePost">;
}

const DRAFTS_KEY = "athlyt_drafts";
const LOCATION_SUGGESTIONS = [
  "Campus field",
  "Local gym",
  "Home court",
  "City park",
];

export default function SavePostScreen({ route }: SavePostScreenProps) {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch: AppDispatch = useDispatch();
  const mediaType = route.params.mediaType ?? "video";
  const previewSource =
    route.params.sourceThumb ??
    (mediaType === "image" ? route.params.source : undefined);

  const [description, setDescription] = useState("");
  const [requestRunning, setRequestRunning] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(
    previewSource ?? null,
  );
  const [privacy, setPrivacy] = useState("Everyone");
  const [location, setLocation] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          justifyContent: "space-between",
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.borderSubtle,
        },
        title: {
          color: theme.colors.text,
        },
        section: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        coverRow: {
          flexDirection: "row",
          gap: theme.spacing.md,
          alignItems: "center",
        },
        coverTile: {
          width: 92,
          height: 120,
          borderRadius: theme.radius.md,
          overflow: "hidden",
          backgroundColor: theme.colors.surface2,
        },
        coverLabel: {
          position: "absolute",
          bottom: 6,
          left: 6,
          right: 6,
          paddingVertical: 2,
          paddingHorizontal: 6,
          borderRadius: 8,
          backgroundColor: "rgba(0,0,0,0.6)",
        },
        coverLabelText: {
          color: "#FFFFFF",
          fontSize: 10,
        },
        coverAddTile: {
          width: 92,
          height: 120,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.xs,
          backgroundColor: theme.colors.surface2,
        },
        coverAddText: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
        },
        captionInput: {
          minHeight: 90,
          padding: theme.spacing.sm,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          color: theme.colors.text,
          textAlignVertical: "top",
        },
        helperText: {
          color: theme.colors.textMuted,
        },
        toolRow: {
          flexDirection: "row",
          gap: theme.spacing.sm,
        },
        toolButton: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface2,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
        },
        toolText: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
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
        locationRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        },
        chip: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface2,
        },
        chipActive: {
          borderColor: theme.colors.accent,
        },
        chipText: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
        },
        chipTextActive: {
          color: theme.colors.text,
          fontWeight: theme.type.fontWeights.bold,
        },
        footer: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        draftButton: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface2,
        },
        draftText: {
          color: theme.colors.text,
          fontWeight: theme.type.fontWeights.bold,
        },
      }),
    [theme],
  );

  const openPrivacySheet = () => {
    const options = ["Everyone", "Friends", "Only me", "Cancel"];
    const cancelButtonIndex = 3;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex < 3) {
            setPrivacy(options[buttonIndex]);
          }
        },
      );
      return;
    }

    Alert.alert("Privacy", "Who can view this post?", [
      { text: "Everyone", onPress: () => setPrivacy("Everyone") },
      { text: "Friends", onPress: () => setPrivacy("Friends") },
      { text: "Only me", onPress: () => setPrivacy("Only me") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const granted = permission.granted || permission.status === "granted";
    if (!granted) {
      Alert.alert(
        "Photos permission required",
        "Enable Photos access in Settings to choose a cover image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleSaveDraft = async () => {
    const draft = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      description,
      mediaType,
      source: route.params.source,
      sourceThumb: route.params.sourceThumb,
      coverUri,
      privacy,
      location,
    };

    try {
      const existing = await AsyncStorage.getItem(DRAFTS_KEY);
      const drafts = existing ? JSON.parse(existing) : [];
      drafts.unshift(draft);
      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      Alert.alert("Draft saved", "You can finish it later.");
      navigation.navigate("feed");
    } catch (error) {
      Alert.alert("Draft failed", "Unable to save this draft.");
    }
  };

  const handleSavePost = () => {
    setRequestRunning(true);
    logEvent("upload_start", { mediaType });

    const thumbnail = mediaType === "video" ? coverUri ?? undefined : undefined;

    dispatch(
      createPost({
        description,
        video: route.params.source,
        thumbnail,
        mediaType,
      }),
    )
      .unwrap()
      .then(() => {
        logEvent("upload_success", { mediaType });
        navigation.navigate("feed");
      })
      .catch((err) => {
        const message = typeof err === "string" ? err : err?.message;
        Alert.alert("Post failed", message || "Unable to create post");
        logEvent("upload_fail", { mediaType, error: message });
        setRequestRunning(false);
      });
  };

  if (requestRunning) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Screen scroll padding={false} style={{ backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="x" size={22} color={theme.colors.text} />
        </Pressable>
        <AppText variant="subtitle" style={styles.title}>
          Post
        </AppText>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.section}>
        <AppText variant="caption" style={styles.helperText}>
          Cover
        </AppText>
        <View style={styles.coverRow}>
          <View style={styles.coverTile}>
            {coverUri ? (
              <Image
                style={{ width: "100%", height: "100%" }}
                source={{ uri: coverUri }}
              />
            ) : (
              <View
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Feather
                  name="image"
                  size={22}
                  color={theme.colors.textMuted}
                />
              </View>
            )}
            <View style={styles.coverLabel}>
              <AppText variant="caption" style={styles.coverLabelText}>
                Cover
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={handlePickCover}
            style={({ pressed }) => [
              styles.coverAddTile,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color={theme.colors.textMuted} />
            <AppText variant="caption" style={styles.coverAddText}>
              Add cover
            </AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" style={styles.helperText}>
          Caption
        </AppText>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a catchy title"
          placeholderTextColor={theme.colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={150}
        />
        <AppText variant="caption" style={styles.helperText}>
          Add hashtags or mentions to help people find your post.
        </AppText>
        <View style={styles.toolRow}>
          {[
            { id: "hash", label: "#" },
            { id: "mention", label: "@" },
            { id: "idea", label: "Ideas" },
            { id: "ai", label: "AI rewrite" },
          ].map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => Alert.alert("Coming soon", `${tool.label} is coming soon.`)}
              style={({ pressed }) => [
                styles.toolButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <AppText variant="caption" style={styles.toolText}>
                {tool.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => Alert.alert("Location", "Location picker is coming soon.")}
        >
          <AppText variant="body" style={styles.rowLabel}>
            Location
          </AppText>
          <AppText variant="body" style={styles.rowValue}>
            {location ? location : "Add location"}
          </AppText>
        </Pressable>
        <View style={styles.locationRow}>
          {LOCATION_SUGGESTIONS.map((item) => {
            const isActive = location === item;
            return (
              <Pressable
                key={item}
                onPress={() => setLocation(isActive ? null : item)}
                style={({ pressed }) => [
                  styles.chip,
                  isActive && styles.chipActive,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <AppText
                  variant="caption"
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {item}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => Alert.alert("Links", "Link support is coming soon.")}
        >
          <AppText variant="body" style={styles.rowLabel}>
            Add link
          </AppText>
          <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
          onPress={openPrivacySheet}
        >
          <AppText variant="body" style={styles.rowLabel}>
            Everyone can view this post
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <AppText variant="body" style={styles.rowValue}>
              {privacy}
            </AppText>
            <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => Alert.alert("More options", "More options are coming soon.")}
        >
          <AppText variant="body" style={styles.rowLabel}>
            More options
          </AppText>
          <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.draftButton,
            { opacity: pressed ? 0.9 : 1, flex: 1 },
          ]}
          onPress={handleSaveDraft}
        >
          <AppText variant="body" style={styles.draftText}>
            Drafts
          </AppText>
        </Pressable>
        <Button title="Post" onPress={handleSavePost} fullWidth={false} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}
