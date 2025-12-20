import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { Camera } from "expo-camera";
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
  const [hasCameraPermissions, setHasCameraPermissions] = useState(false);
  const [hasAudioPermissions, setHasAudioPermissions] = useState(false);
  const [hasGalleryPermissions, setHasGalleryPermissions] = useState(false);

  const [galleryItems, setGalleryItems] = useState<MediaLibrary.Asset[]>([]);

  const [cameraRef, setCameraRef] = useState<any>(null);
  // Guard against CameraType being undefined in dev/Go by providing safe defaults
  const cameraTypes = (Camera as any)?.Constants?.Type ?? {};
  const defaultBack = cameraTypes.back ?? "back";
  const defaultFront = cameraTypes.front ?? "front";
  const [cameraType, setCameraType] = useState<any>(defaultBack);
  // Use runtime-available FlashMode or safe string fallbacks
  const flashModes = (Camera as any)?.Constants?.FlashMode ?? {};
  const flashOff = flashModes.off ?? "off";
  const flashTorch = flashModes.torch ?? "torch";
  const [cameraFlash, setCameraFlash] = useState<any>(flashOff);

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
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermissions(cameraStatus.status == "granted");

      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermissions(audioStatus.status == "granted");

      const galleryStatus =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermissions(galleryStatus.status == "granted");

      if (galleryStatus.status == "granted") {
        const userGalleryMedia = await MediaLibrary.getAssetsAsync({
          sortBy: ["creationTime"],
          mediaType: ["video"],
        });
        setGalleryItems(userGalleryMedia.assets);
      }
    })();
  }, []);

  const recordVideo = async () => {
    if (cameraRef) {
      try {
        const options = {
          maxDuration: 60,
          // Guard in case Camera.Constants is undefined in Expo Go
          quality: (Camera as any)?.Constants?.VideoQuality?.["480"] ?? ("480p" as any),
        };
        const videoRecordPromise = cameraRef.recordAsync(options);
        if (videoRecordPromise) {
          const data = await videoRecordPromise;
          const source = data.uri;
          let sourceThumb = await generateThumbnail(source);
          if (sourceThumb) {
            navigation.navigate("savePost", { source, sourceThumb });
          }
        }
      } catch (error) {
        console.warn(error);
      }
    }
  };

  const stopVideo = async () => {
    if (cameraRef) {
      cameraRef.stopRecording();
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // Prefer new MediaType API when available; fall back to MediaTypeOptions for older typings
      mediaTypes: [
        (ImagePicker as any)?.MediaType?.Video ?? ImagePicker.MediaTypeOptions.Videos,
      ],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled) {
      const sourceThumb = await generateThumbnail(result.assets[0].uri);
      if (sourceThumb) {
        navigation.navigate("savePost", {
          source: result.assets[0].uri,
          sourceThumb,
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

  if (!hasCameraPermissions || !hasAudioPermissions || !hasGalleryPermissions) {
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
              requestCameraPermissionsAsync().then((cameraStatus) =>
                setHasCameraPermissions(cameraStatus.status == "granted"),
              );
              requestMicrophonePermissionsAsync().then((audioStatus) =>
                setHasAudioPermissions(audioStatus.status == "granted"),
              );
              ImagePicker.requestMediaLibraryPermissionsAsync().then(
                (galleryStatus) =>
                  setHasGalleryPermissions(galleryStatus.status == "granted"),
              );
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
          <Camera
            ref={(ref) => setCameraRef(ref)}
            style={styles.camera}
            ratio={"16:9"}
            type={cameraType}
            flashMode={cameraFlash}
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
              setCameraType(
                cameraType === defaultBack ? defaultFront : defaultBack,
              )
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
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() =>
              setCameraFlash(
                cameraFlash === flashOff ? flashTorch : flashOff,
              )
            }
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
            onLongPress={recordVideo}
            onPressOut={stopVideo}
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
