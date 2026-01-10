import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useIsFocused } from "@react-navigation/core";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootStackParamList } from "../../navigation/main";
import Screen from "../../components/layout/Screen";
import { useTheme } from "../../theme/useTheme";
import AppText from "../../components/ui/AppText";
import Button from "../../components/ui/Button";
import ActionRail from "../../components/camera/ActionRail";
import ModeSelector from "../../components/camera/ModeSelector";

type CaptureMode = {
  id: string;
  label: string;
  type: "photo" | "video" | "text";
  maxDuration?: number;
};

const CAPTURE_MODES: CaptureMode[] = [
  { id: "10m", label: "10m", type: "video", maxDuration: 600 },
  { id: "60s", label: "60s", type: "video", maxDuration: 60 },
  { id: "15s", label: "15s", type: "video", maxDuration: 15 },
  { id: "photo", label: "Photo", type: "photo" },
  { id: "text", label: "Text", type: "text" },
];

export default function CameraScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const hasCameraPermissions = cameraPermission?.status === "granted";
  const hasAudioPermissions = microphonePermission?.status === "granted";
  const hasRequiredPermissions = hasCameraPermissions;
  const [hasGalleryPermissions, setHasGalleryPermissions] = useState(false);
  const [galleryItems, setGalleryItems] = useState<MediaLibrary.Asset[]>([]);

  const [selectedModeId, setSelectedModeId] = useState("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const cameraRef = useRef<React.ElementRef<typeof CameraView>>(null);
  const isRecordingRef = useRef(false);
  const [cameraType, setCameraType] = useState<CameraType>("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const torchSupported = cameraType === "back";

  const [isCameraReady, setIsCameraReady] = useState(false);
  const isFocused = useIsFocused();

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const selectedMode = useMemo(
    () => CAPTURE_MODES.find((mode) => mode.id === selectedModeId),
    [selectedModeId],
  );

  const isVideoMode = selectedMode?.type === "video";
  const isPhotoMode = selectedMode?.type === "photo";
  const isTextMode = selectedMode?.type === "text";

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
        topBar: {
          position: "absolute",
          top: insets.top + theme.spacing.sm,
          left: 0,
          right: 0,
          alignItems: "center",
        },
        soundPill: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.55)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        },
        soundText: {
          color: theme.colors.text,
          fontWeight: theme.type.fontWeights.bold,
        },
        railContainer: {
          position: "absolute",
          right: theme.spacing.md,
          top: insets.top + theme.spacing.xl,
        },
        bottomSection: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom + theme.spacing.md,
          gap: theme.spacing.md,
        },
        bottomBarContainer: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
        },
        recordButton: {
          height: 84,
          width: 84,
          borderRadius: 42,
          backgroundColor: theme.colors.surface2,
          borderWidth: 3,
          borderColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        recordButtonRecording: {
          borderColor: theme.colors.danger,
        },
        recordButtonInner: {
          height: 60,
          width: 60,
          borderRadius: 30,
          backgroundColor: theme.colors.accent,
        },
        recordButtonInnerRecording: {
          backgroundColor: theme.colors.danger,
          borderRadius: 12,
          width: 46,
          height: 46,
        },
        galleryButton: {
          borderRadius: theme.radius.md,
          overflow: "hidden",
          width: 56,
          height: 56,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
          backgroundColor: theme.colors.surface2,
        },
        galleryButtonImage: {
          width: 56,
          height: 56,
        },
        galleryButtonPlaceholder: {
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        hintText: {
          color: theme.colors.textMuted,
          textAlign: "center",
          marginTop: theme.spacing.xs,
        },
      }),
    [insets.bottom, insets.top, theme],
  );

  const syncGalleryItems = async (request: boolean) => {
    const galleryStatus = request
      ? await MediaLibrary.requestPermissionsAsync()
      : await MediaLibrary.getPermissionsAsync();
    const granted = galleryStatus.granted || galleryStatus.status === "granted";
    setHasGalleryPermissions(granted);

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

  useEffect(() => {
    (async () => {
      await requestCameraPermission();
      await syncGalleryItems(false);
    })();
  }, [requestCameraPermission]);

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

  const recordVideo = async (maxDuration?: number) => {
    if (!cameraRef.current || !isCameraReady || isRecordingRef.current) {
      return;
    }

    if (!hasAudioPermissions) {
      const updated = await requestMicrophonePermission();
      if (updated.status !== "granted") {
        Alert.alert(
          "Microphone required",
          "Enable microphone access to record video with sound.",
        );
        return;
      }
    }

    try {
      isRecordingRef.current = true;
      setIsRecording(true);
      const data = await cameraRef.current.recordAsync({
        maxDuration: maxDuration ?? 60,
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
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
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

  const openGalleryPicker = async () => {
    navigation.navigate("galleryPicker");
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
  const showGalleryPreview = hasGalleryPermissions && Boolean(latestGalleryItem?.uri);

  const actionItems = [
    {
      id: "flip",
      icon: "refresh-ccw",
      label: "Flip",
      onPress: () =>
        setCameraType((prev) => (prev === "back" ? "front" : "back")),
    },
    {
      id: "flash",
      icon: "zap",
      label: "Flash",
      onPress: () => {
        if (!torchSupported) return;
        setTorchEnabled((prev) => !prev);
      },
      active: torchEnabled,
      disabled: !torchSupported,
    },
    {
      id: "timer",
      icon: "clock",
      label: "Timer",
      onPress: () => Alert.alert("Timer", "Timer controls are coming soon."),
    },
    {
      id: "effects",
      icon: "aperture",
      label: "Effects",
      onPress: () => Alert.alert("Effects", "Effects are coming soon."),
    },
    {
      id: "mic",
      icon: audioEnabled ? "mic" : "mic-off",
      label: "Mic",
      onPress: () => setAudioEnabled((prev) => !prev),
      active: audioEnabled,
    },
    {
      id: "enhance",
      icon: "star",
      label: "Enhance",
      onPress: () => Alert.alert("Enhance", "Enhance is coming soon."),
    },
  ];

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
          <Button
            title="Recheck permissions"
            onPress={() => {
              syncGalleryItems(true);
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
        {isFocused ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            ratio="16:9"
            mode={isVideoMode ? "video" : "picture"}
            facing={cameraType}
            enableTorch={torchSupported ? torchEnabled : false}
            onCameraReady={() => setIsCameraReady(true)}
          />
        ) : null}

        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.navigate("soundPicker")}
            style={({ pressed }) => [
              styles.soundPill,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="music" size={16} color={theme.colors.text} />
            <AppText variant="caption" style={styles.soundText}>
              Add sound
            </AppText>
          </Pressable>
        </View>

        <View style={styles.railContainer}>
          <ActionRail items={actionItems} />
        </View>

        <View style={styles.bottomSection}>
          <ModeSelector
            options={CAPTURE_MODES.map(({ id, label }) => ({ id, label }))}
            value={selectedModeId}
            onChange={setSelectedModeId}
          />

          <View style={styles.bottomBarContainer}>
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={openGalleryPicker}
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
                if (isPhotoMode) {
                  takePhoto();
                  return;
                }
                if (isTextMode) {
                  Alert.alert("Text", "Text posts are coming soon.");
                }
              }}
              onPressIn={() => {
                if (isVideoMode) {
                  recordVideo(selectedMode?.maxDuration);
                }
              }}
              onPressOut={() => {
                if (isVideoMode && isRecordingRef.current) {
                  stopVideo();
                }
              }}
              style={({ pressed }) => [
                styles.recordButton,
                isRecording && styles.recordButtonRecording,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View
                style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonInnerRecording,
                ]}
              />
            </Pressable>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              {isVideoMode ? (
                <AppText variant="caption" style={styles.hintText}>
                  Hold to record
                </AppText>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}
