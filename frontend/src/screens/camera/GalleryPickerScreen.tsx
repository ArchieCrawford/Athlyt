import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Screen from "../../components/layout/Screen";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { useTheme } from "../../theme/useTheme";
import { RootStackParamList } from "../../navigation/main";

type GalleryFilter = "All" | "Videos" | "Photos" | "Live Photos";

type PermissionAccess = "none" | "limited" | "all";

const FILTERS: GalleryFilter[] = ["All", "Videos", "Photos", "Live Photos"];

export default function GalleryPickerScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [filter, setFilter] = useState<GalleryFilter>("All");
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [access, setAccess] = useState<PermissionAccess>("none");

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
        headerLeft: {
          width: 40,
          alignItems: "flex-start",
        },
        headerRight: {
          width: 90,
          alignItems: "flex-end",
        },
        title: {
          color: theme.colors.text,
        },
        filterRow: {
          flexDirection: "row",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.sm,
        },
        filterPill: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface2,
        },
        filterPillActive: {
          borderColor: theme.colors.accent,
        },
        filterText: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        filterTextActive: {
          color: theme.colors.text,
          fontWeight: theme.type.fontWeights.bold,
        },
        listContent: {
          paddingBottom: insets.bottom + theme.spacing.lg,
        },
        tile: {
          flex: 1,
          aspectRatio: 1,
          margin: 1,
          backgroundColor: theme.colors.surface2,
        },
        tileImage: {
          width: "100%",
          height: "100%",
        },
        videoBadge: {
          position: "absolute",
          right: 6,
          bottom: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
        },
        videoBadgeText: {
          color: "#FFFFFF",
          fontSize: 10,
        },
        emptyState: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.md,
        },
        emptyText: {
          color: theme.colors.textMuted,
          textAlign: "center",
        },
      }),
    [insets.bottom, theme],
  );

  const formatDuration = (duration: number) => {
    if (!duration || Number.isNaN(duration)) {
      return "0:00";
    }
    const totalSeconds = Math.round(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${paddedSeconds}`;
  };

  const isLivePhoto = (asset: MediaLibrary.Asset) => {
    const mediaSubtypes = (asset as { mediaSubtypes?: Array<string | number> })
      .mediaSubtypes;
    if (!mediaSubtypes || mediaSubtypes.length === 0) {
      return false;
    }
    const liveSubtype = (MediaLibrary as { MediaSubtype?: { photoLive?: string | number } })
      .MediaSubtype?.photoLive;
    return mediaSubtypes.some((subtype) => {
      if (liveSubtype && subtype === liveSubtype) {
        return true;
      }
      return String(subtype).toLowerCase().includes("live");
    });
  };

  const syncPermissions = useCallback(async (request: boolean) => {
    const permission = request
      ? await MediaLibrary.requestPermissionsAsync()
      : await MediaLibrary.getPermissionsAsync();
    const granted = permission.granted || permission.status === "granted";
    const accessPrivileges = (permission as { accessPrivileges?: string })
      .accessPrivileges;
    const accessLevel: PermissionAccess = !granted
      ? "none"
      : accessPrivileges === "limited"
        ? "limited"
        : "all";

    setHasPermission(granted);
    setPermissionStatus(permission.status ?? null);
    setAccess(accessLevel);

    if (!granted) {
      setAssets([]);
    }

    return granted;
  }, []);

  const loadAssets = useCallback(
    async (nextFilter: GalleryFilter) => {
      if (!hasPermission) return;
      setLoading(true);
      try {
        const mediaType =
          nextFilter === "Videos"
            ? [MediaLibrary.MediaType.video]
            : nextFilter === "Photos" || nextFilter === "Live Photos"
              ? [MediaLibrary.MediaType.photo]
              : [MediaLibrary.MediaType.video, MediaLibrary.MediaType.photo];

        const result = await MediaLibrary.getAssetsAsync({
          sortBy: ["creationTime"],
          mediaType,
          first: 120,
        });

        const filtered =
          nextFilter === "Live Photos"
            ? result.assets.filter(isLivePhoto)
            : result.assets;

        setAssets(filtered);
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    },
    [hasPermission],
  );

  useEffect(() => {
    (async () => {
      await syncPermissions(true);
    })();
  }, [loadAssets, syncPermissions]);

  useEffect(() => {
    if (hasPermission) {
      loadAssets(filter);
    }
  }, [filter, hasPermission, loadAssets]);

  const openPermissionsPicker = async () => {
    const presentPicker = (
      MediaLibrary as { presentPermissionsPickerAsync?: () => Promise<void> }
    ).presentPermissionsPickerAsync;

    if (presentPicker) {
      try {
        await presentPicker();
        const granted = await syncPermissions(false);
        if (granted) {
          loadAssets(filter);
        }
        return;
      } catch (error) {
        console.warn(error);
      }
    }

    Alert.alert(
      "Permissions",
      "Open Settings to change photo access.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
  };

  const resolveAssetUri = async (asset: MediaLibrary.Asset) => {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      return info.localUri ?? asset.uri;
    } catch (error) {
      console.warn(error);
      return asset.uri;
    }
  };

  const handleSelectAsset = async (asset: MediaLibrary.Asset) => {
    const sourceUri = await resolveAssetUri(asset);
    if (!sourceUri) {
      Alert.alert("Unable to load media", "Please try another item.");
      return;
    }

    if (asset.mediaType === "video") {
      let thumbUri: string | undefined;
      try {
        const sourceThumb = await VideoThumbnails.getThumbnailAsync(sourceUri, {
          time: 1000,
        });
        thumbUri = sourceThumb.uri;
      } catch (error) {
        console.warn(error);
      }
      navigation.navigate("savePost", {
        source: sourceUri,
        sourceThumb: thumbUri,
        mediaType: "video",
      });
      return;
    }

    navigation.navigate("savePost", {
      source: sourceUri,
      sourceThumb: sourceUri,
      mediaType: "image",
    });
  };

  const renderTile = ({ item }: { item: MediaLibrary.Asset }) => (
    <Pressable
      onPress={() => handleSelectAsset(item)}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Image style={styles.tileImage} source={{ uri: item.uri }} />
      {item.mediaType === "video" ? (
        <View style={styles.videoBadge}>
          <Feather name="video" size={12} color="#FFFFFF" />
          <AppText variant="caption" style={styles.videoBadgeText}>
            {formatDuration(item.duration ?? 0)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );

  if (!hasPermission) {
    const isDenied = permissionStatus === "denied";
    return (
      <Screen padding={false}>
        <View style={styles.header}>
          <Pressable style={styles.headerLeft} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color={theme.colors.text} />
          </Pressable>
          <AppText variant="subtitle" style={styles.title}>
            Recents
          </AppText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Feather name="image" size={40} color={theme.colors.textMuted} />
          <AppText variant="body" style={styles.emptyText}>
            Allow access to your photo library to see your recents.
          </AppText>
          <Button
            title={isDenied ? "Open Settings" : "Allow Photos"}
            onPress={() => {
              if (isDenied) {
                Linking.openSettings();
                return;
              }
              syncPermissions(true).then((granted) => {
                if (granted) {
                  loadAssets(filter);
                }
              });
            }}
            fullWidth={false}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padding={false}>
      <View style={styles.header}>
        <Pressable style={styles.headerLeft} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={theme.colors.text} />
        </Pressable>
        <AppText variant="subtitle" style={styles.title}>
          Recents
        </AppText>
        <View style={styles.headerRight}>
          {access === "limited" ? (
            <Button
              title="Manage"
              variant="secondary"
              fullWidth={false}
              onPress={openPermissionsPicker}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const isActive = item === filter;
          return (
            <Pressable
              key={item}
              onPress={() => {
                setFilter(item);
              }}
              style={({ pressed }) => [
                styles.filterPill,
                isActive && styles.filterPillActive,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <AppText
                variant="caption"
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {item}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText variant="body" style={styles.emptyText}>
            No media found in this filter.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={renderTile}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
