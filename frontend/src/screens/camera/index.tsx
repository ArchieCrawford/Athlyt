import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, View, StyleSheet, Image, Pressable } from "react-native";
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
      }),
    [insets.bottom, insets.top, theme],
  );
  useEffect(() => {
    (async () => {
      await requestCameraPermission();
      await requestMicrophonePermission();

      const galleryStatus = await MediaLibrary.requestPermissionsAsync();
      setHasGalleryPermissions(galleryStatus.status == "granted");

      await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (galleryStatus.status == "granted") {
        const userGalleryMedia = await MediaLibrary.getAssetsAsync({
          sortBy: ["creationTime"],
          mediaType: [MediaLibrary.MediaType.video, MediaLibrary.MediaType.photo],
        });
        setGalleryItems(userGalleryMedia.assets);
      }
    })();
  }, [requestCameraPermission, requestMicrophonePermission]);

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
    if (!hasGalleryPermissions) {
      const galleryStatus = await MediaLibrary.requestPermissionsAsync();
      const granted = galleryStatus.status === "granted";
      setHasGalleryPermissions(granted);
      if (!granted) {
        Alert.alert(
          "Gallery access required",
          "Gallery access is limited in Expo Go. Use a development build for full access.",
        );
        return;
      }
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
            Gallery access can be limited in Expo Go. A development build is
            required for full gallery support.
          </AppText>
          <Button
            title="Recheck permissions"
            onPress={() => {
              MediaLibrary.requestPermissionsAsync().then(
                async (galleryStatus) => {
                  setHasGalleryPermissions(galleryStatus.status == "granted");
                  if (galleryStatus.status == "granted") {
                    const userGalleryMedia =
                      await MediaLibrary.getAssetsAsync({
                        sortBy: ["creationTime"],
                        mediaType: [
                          MediaLibrary.MediaType.video,
                          MediaLibrary.MediaType.photo,
                        ],
                      });
                    setGalleryItems(userGalleryMedia.assets);
                  }
                },
              );
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
        {!hasGalleryPermissions ? (
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
            }}
          >
            <AppText variant="caption">
              Gallery access is limited in Expo Go. Use a development build for
              full access.
            </AppText>
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
              {galleryItems[galleryItems.length - 1] ? (
                <Image
                  style={styles.galleryButtonImage}
                  source={{ uri: galleryItems[galleryItems.length - 1].uri }}
                />
              ) : null}
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
