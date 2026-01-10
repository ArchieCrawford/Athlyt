import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, View, StyleSheet, Image, Pressable } from "react-native";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useIsFocused } from "@react-navigation/core";
import { Feather } from "@expo/vector-icons";

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/main";
import Screen from "../../components/layout/Screen";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Function that renders a component responsible showing
 * a view with the camera preview, recording videos, controling the camera and
 * letting the user pick a video from the gallery
 * @returns Functional Component
 */
export default function CameraScreen() {
  console.log("CameraScreen loaded: 2025-12-19 v2");
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const hasCameraPermissions = cameraPermission?.status === "granted";
  const hasAudioPermissions = microphonePermission?.status === "granted";
  const hasRequiredPermissions = hasCameraPermissions && hasAudioPermissions;
  const [hasGalleryPermissions, setHasGalleryPermissions] = useState(false);
  const [galleryAccess, setGalleryAccess] = useState<
    "none" | "limited" | "all"
  >("none");
  const [galleryNoticeDismissed, setGalleryNoticeDismissed] = useState(false);

  const [galleryItems, setGalleryItems] = useState<MediaLibrary.Asset[]>([]);

  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);
  const isRecordingRef = useRef(false);
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const torchSupported = cameraType === "back";

  const [isCameraReady, setIsCameraReady] = useState(false);
  const isFocused = useIsFocused();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.bg,
        },
        camera: {
          ...StyleSheet.absoluteFillObject,
        },
        sideBarContainer: {
          position: "absolute",
          right: theme.spacing.md,
          top: insets.top + theme.spacing.lg,
          gap: theme.spacing.md,
        },
        sideBarButton: {
          alignItems: "center",
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.sm,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surface2,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
        iconText: {
          color: theme.colors.textMuted,
          fontSize: theme.type.fontSizes.caption,
          marginTop: theme.spacing.xs,
        },
        bottomBarContainer: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom + theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        },
        recordButton: {
          height: 76,
          width: 76,
          borderRadius: 38,
          backgroundColor: theme.colors.surface2,
          borderWidth: 2,
          borderColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        recordButtonInner: {
          height: 56,
          width: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.accent,
        },
        galleryButton: {
          borderRadius: theme.radius.md,
          overflow: "hidden",
          width: 52,
          height: 52,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface2,
        },
        galleryButtonImage: {
          width: 52,
          height: 52,
        },
        galleryButtonPlaceholder: {
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [insets.bottom, insets.top, theme],
  );
  const syncGalleryItems = async (request: boolean) => {
    const galleryStatus = request
      ? await MediaLibrary.requestPermissionsAsync()
      : await MediaLibrary.getPermissionsAsync();
    const granted = galleryStatus.granted || galleryStatus.status === "granted";
    const accessPrivileges = (galleryStatus as { accessPrivileges?: string })
      .accessPrivileges;
    const access =
      !granted ? "none" : accessPrivileges === "limited" ? "limited" : "all";
    setHasGalleryPermissions(granted);
    setGalleryAccess(access);
    if (request && galleryStatus.status !== "undetermined") {
      setGalleryNoticeDismissed(true);
    }

    if (granted) {
      const userGalleryMedia = await MediaLibrary.getAssetsAsync({
        sortBy: ["creationTime"],
        mediaType: [MediaLibrary.MediaType.video, MediaLibrary.MediaType.photo],
      });
      setGalleryItems(userGalleryMedia.assets);
    } else {
      setGalleryItems([]);
    }
  };

  const openPhotoSettings = () => {
    setGalleryNoticeDismissed(true);
    Linking.openSettings().catch(() => {
      Alert.alert("Unable to open settings", "Open system settings manually.");
    });
  };

  const openGalleryAccessPicker = async () => {
    setGalleryNoticeDismissed(true);
    const presentPicker = (
      MediaLibrary as { presentPermissionsPickerAsync?: () => Promise<void> }
    ).presentPermissionsPickerAsync;

    if (presentPicker) {
      try {
        await presentPicker();
        await syncGalleryItems(false);
        return;
      } catch (error) {
        console.warn(error);
      }
    }

    openPhotoSettings();
  };

  const ensurePickerPermissions = async () => {
    const pickerStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const granted = pickerStatus.granted || pickerStatus.status === "granted";
    if (!granted) {
      Alert.alert(
        "Photos permission required",
        "Enable Photos access in Settings to select media.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openPhotoSettings },
        ],
      );
    } else {
      await syncGalleryItems(false);
    }
    return granted;
  };

  useEffect(() => {
    (async () => {
      await requestCameraPermission();
      await requestMicrophonePermission();
      await syncGalleryItems(true);
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, [requestCameraPermission, requestMicrophonePermission]);

  useEffect(() => {
    if (isFocused) {
      syncGalleryItems(false);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!torchSupported && torchEnabled) {
      setTorchEnabled(false);
    }
  }, [torchEnabled, torchSupported]);

  const recordVideo = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const data = await cameraRef.current.recordAsync({
          maxDuration: 60,
        });
        const source = data.uri;
        const sourceThumb = await generateThumbnail(source);
        navigation.navigate("savePost", {
          source,
          sourceThumb,
          mediaType: "video",
        });
      } catch (error) {
        console.warn(error);
      }
    }
  };

  const stopVideo = async () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady) {
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        navigation.navigate("savePost", {
          source: photo.uri,
          sourceThumb: photo.uri,
          mediaType: "image",
        });
      }
    } catch (error) {
      console.warn(error);
    }
  };

  const pickFromGallery = async () => {
    const pickerGranted = await ensurePickerPermissions();
    if (!pickerGranted) {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [
        ImagePicker.MediaType.Images,
        ImagePicker.MediaType.Videos,
      ],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.type === "video") {
        const sourceThumb = await generateThumbnail(asset.uri);
        navigation.navigate("savePost", {
          source: asset.uri,
          sourceThumb,
          mediaType: "video",
        });
      } else {
        navigation.navigate("savePost", {
          source: asset.uri,
          sourceThumb: asset.uri,
          mediaType: "image",
        });
      }
    }
  };

  const generateThumbnail = async (source: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(source, {
        time: 5000,
      });
      return uri;
    } catch (e) {
      console.warn(e);
    }
  };

  const latestGalleryItem = galleryItems[galleryItems.length - 1];
  const showGalleryPreview = Boolean(latestGalleryItem?.uri);
  const showGalleryNotice =
    !galleryNoticeDismissed &&
    (!hasGalleryPermissions || galleryAccess === "limited");
  const galleryNoticeText = !hasGalleryPermissions
    ? "Photos permission is required to preview your gallery."
    : "Photos access is limited. Add more photos for full gallery access.";

  if (!hasRequiredPermissions) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", gap: theme.spacing.md }}>
          <AppText variant="subtitle">Enable permissions</AppText>
          <AppText variant="muted">
            Camera: {String(hasCameraPermissions)}{" "}
            Audio: {String(hasAudioPermissions)}{" "}
            Gallery: {String(hasGalleryPermissions)}
          </AppText>
          <AppText variant="muted">
            Photos permission is required to preview recent items. You can still
            open the picker to select media.
          </AppText>
          <Button
            title="Recheck permissions"
            onPress={() => {
              syncGalleryItems(true);
              ImagePicker.requestMediaLibraryPermissionsAsync();
              requestCameraPermission();
              requestMicrophonePermission();
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen fullBleed padding={false}>
      <View style={styles.container}>
        {showGalleryNotice ? (
          <View
            style={{
              position: "absolute",
              top: insets.top + theme.spacing.sm,
              left: theme.spacing.md,
              right: theme.spacing.md,
              zIndex: 10,
              padding: theme.spacing.sm,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface2,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              gap: theme.spacing.xs,
            }}
          >
            <AppText variant="caption">{galleryNoticeText}</AppText>
            <Button
              title={!hasGalleryPermissions ? "Open Settings" : "Manage Photos"}
              variant="secondary"
              fullWidth={false}
              onPress={
                !hasGalleryPermissions ? openPhotoSettings : openGalleryAccessPicker
              }
              style={{ alignSelf: "flex-start" }}
            />
          </View>
        ) : null}
        {isFocused ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            ratio="16:9"
            mode="video"
            facing={cameraType}
            enableTorch={torchSupported ? torchEnabled : false}
            onCameraReady={() => setIsCameraReady(true)}
          />
        ) : null}

        <View style={styles.sideBarContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.sideBarButton,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() =>
              setCameraType((prev) => (prev === "back" ? "front" : "back"))
            }
          >
            <Feather name="refresh-ccw" size={22} color={theme.colors.text} />
            <AppText variant="caption" style={styles.iconText}>
              Flip
            </AppText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sideBarButton,
              { opacity: pressed ? 0.85 : torchSupported ? 1 : 0.5 },
            ]}
            onPress={() => {
              if (!torchSupported) {
                return;
              }
              setTorchEnabled((prev) => !prev);
            }}
            disabled={!torchSupported}
          >
            <Feather name="zap" size={22} color={theme.colors.text} />
            <AppText variant="caption" style={styles.iconText}>
              Flash
            </AppText>
          </Pressable>
        </View>

        <View style={styles.bottomBarContainer}>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={pickFromGallery}
              style={({ pressed }) => [
                styles.galleryButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {showGalleryPreview ? (
                <Image
                  style={styles.galleryButtonImage}
                  source={{ uri: latestGalleryItem?.uri }}
                />
              ) : (
                <View style={styles.galleryButtonPlaceholder}>
                  <Feather
                    name="image"
                    size={22}
                    color={theme.colors.textMuted}
                  />
                </View>
              )}
            </Pressable>
          </View>
          <Pressable
            disabled={!isCameraReady}
            onPress={() => {
              if (isRecordingRef.current) {
                return;
              }
              takePhoto();
            }}
            onLongPress={() => {
              if (isRecordingRef.current) {
                return;
              }
              isRecordingRef.current = true;
              recordVideo();
            }}
            onPressOut={() => {
              if (isRecordingRef.current) {
                stopVideo();
              }
              isRecordingRef.current = false;
            }}
            style={({ pressed }) => [
              styles.recordButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={styles.recordButtonInner} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
      </View>
    </Screen>
  );
}
