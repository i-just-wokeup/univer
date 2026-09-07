import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { SwitchCamera, X, Zap, ZapOff } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import type { PostCapturedPhoto } from "../../features/feed/postMediaLibrary";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

type PostCameraProps = {
  onCaptured: (photo: PostCapturedPhoto) => void;
  onClose: () => void;
};

const CAMERA_ZOOM_SENSITIVITY = 0.25;

function clampCameraZoom(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function PostCamera({ onCaptured, onClose }: PostCameraProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const pinchStartZoomRef = useRef(0);

  // RNGH callbacks run after render on gesture events; the hooks lint cannot infer that contract.
  /* eslint-disable react-hooks/refs */
  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(isCameraReady && !isCapturing)
        .runOnJS(true)
        .onStart(() => {
          pinchStartZoomRef.current = zoomRef.current;
        })
        .onUpdate((event) => {
          const zoomDelta =
            (Math.log(event.scale) / Math.LN2) * CAMERA_ZOOM_SENSITIVITY;
          const nextZoom = clampCameraZoom(
            pinchStartZoomRef.current + zoomDelta,
          );
          zoomRef.current = nextZoom;
          setZoom(nextZoom);
        }),
    [isCameraReady, isCapturing],
  );
  /* eslint-enable react-hooks/refs */

  async function handleCapture() {
    if (!isCameraReady || isCapturing) {
      return;
    }

    setErrorMessage("");
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });

      if (!photo?.uri || photo.width <= 0 || photo.height <= 0) {
        throw new Error("촬영 결과를 불러오지 못했습니다.");
      }

      onCaptured({
        height: photo.height,
        uri: photo.uri,
        width: photo.width,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "사진을 촬영하지 못했습니다.",
      );
    } finally {
      setIsCapturing(false);
    }
  }

  function handleSwitchCamera() {
    setIsCameraReady(false);
    setFlash("off");
    setZoom(0);
    zoomRef.current = 0;
    pinchStartZoomRef.current = 0;
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  function handleClose() {
    setZoom(0);
    zoomRef.current = 0;
    pinchStartZoomRef.current = 0;
    onClose();
  }

  const permissionContent = !permission ? (
    <ActivityIndicator color={colors.onMediaGlyph} size="large" />
  ) : (
    <>
      <Text style={styles.permissionTitle}>카메라 권한이 필요합니다</Text>
      <Text style={styles.permissionDescription}>
        게시물에 사용할 사진을 촬영하려면 카메라 접근을 허용해 주세요.
      </Text>
      <Pressable
        accessibilityLabel={
          permission.canAskAgain ? "카메라 권한 허용" : "앱 설정 열기"
        }
        accessibilityRole="button"
        onPress={() => {
          if (permission.canAskAgain) {
            void requestPermission();
            return;
          }
          void Linking.openSettings();
        }}
        style={({ pressed }) => [
          styles.permissionButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.permissionButtonText}>
          {permission.canAskAgain ? "카메라 권한 허용" : "설정에서 권한 허용"}
        </Text>
      </Pressable>
    </>
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible
    >
      {/* Android modals live outside the app-level gesture root. */}
      <GestureHandlerRootView style={styles.screen}>
        <StatusBar style="light" />

        {permission?.granted ? (
          <>
            <CameraView
              animateShutter={false}
              facing={facing}
              flash={flash}
              mode="picture"
              onCameraReady={() => setIsCameraReady(true)}
              onMountError={() => {
                setErrorMessage("카메라를 시작하지 못했습니다.");
              }}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              zoom={zoom}
            />
            {/* Keep gesture attachment separate from the native camera capture view. */}
            <GestureDetector gesture={pinchGesture}>
              <View style={styles.gestureSurface} />
            </GestureDetector>

            {!isCameraReady ? (
              <View pointerEvents="none" style={styles.loadingCover}>
                <ActivityIndicator color={colors.onMediaGlyph} size="large" />
              </View>
            ) : null}

            <SafeAreaView edges={["top"]} style={styles.topControls}>
              <Pressable
                accessibilityLabel="카메라 닫기"
                accessibilityRole="button"
                hitSlop={10}
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <X color={colors.onMediaGlyph} size={27} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                accessibilityLabel={
                  flash === "on" ? "플래시 끄기" : "플래시 켜기"
                }
                accessibilityRole="button"
                hitSlop={10}
                onPress={() =>
                  setFlash((current) => (current === "off" ? "on" : "off"))
                }
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                {flash === "on" ? (
                  <Zap
                    color={colors.onMediaGlyph}
                    fill={colors.onMediaGlyph}
                    size={24}
                  />
                ) : (
                  <ZapOff
                    color={colors.onMediaGlyph}
                    size={24}
                    strokeWidth={2.4}
                  />
                )}
              </Pressable>
            </SafeAreaView>

            <SafeAreaView edges={["bottom"]} style={styles.bottomControls}>
              <View style={styles.controlPlaceholder} />
              <Pressable
                accessibilityLabel="사진 촬영"
                accessibilityRole="button"
                disabled={!isCameraReady || isCapturing}
                onPress={() => {
                  void handleCapture();
                }}
                style={({ pressed }) => [
                  styles.captureOuter,
                  !isCameraReady || isCapturing ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.captureInner} />
              </Pressable>
              <Pressable
                accessibilityLabel="전후면 카메라 전환"
                accessibilityRole="button"
                disabled={isCapturing}
                onPress={handleSwitchCamera}
                style={({ pressed }) => [
                  styles.sideButton,
                  isCapturing ? styles.disabled : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <SwitchCamera
                  color={colors.onMediaGlyph}
                  size={28}
                  strokeWidth={2.2}
                />
              </Pressable>
            </SafeAreaView>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <SafeAreaView style={styles.permissionScreen}>
            <Pressable
              accessibilityLabel="카메라 닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={handleClose}
              style={styles.permissionClose}
            >
              <X color={colors.onMediaGlyph} size={27} strokeWidth={2.5} />
            </Pressable>
            <View style={styles.permissionContent}>{permissionContent}</View>
          </SafeAreaView>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.black,
    },
    loadingCover: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.black,
    },
    gestureSurface: {
      ...StyleSheet.absoluteFillObject,
    },
    topControls: {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: c.scrimWeak,
    },
    bottomControls: {
      position: "absolute",
      right: 0,
      bottom: 0,
      left: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xxxl,
      paddingBottom: spacing.xl,
    },
    controlPlaceholder: {
      width: 52,
      height: 52,
    },
    sideButton: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 26,
      backgroundColor: c.scrimWeak,
    },
    captureOuter: {
      width: 78,
      height: 78,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 39,
      borderWidth: 4,
      borderColor: c.onMediaBorder,
      backgroundColor: c.onMediaFill,
    },
    captureInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.onMediaFillStrong,
    },
    errorBanner: {
      position: "absolute",
      right: spacing.xxl,
      bottom: 124,
      left: spacing.xxl,
      borderRadius: radius.sm,
      backgroundColor: c.dangerSolid,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    errorText: {
      color: c.white,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
    permissionScreen: {
      flex: 1,
      backgroundColor: c.black,
    },
    permissionClose: {
      position: "absolute",
      top: spacing.sm,
      left: spacing.lg,
      zIndex: 1,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: c.scrimWeak,
    },
    permissionContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.xxxl,
    },
    permissionTitle: {
      color: c.white,
      fontSize: fontSize.heading,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
    permissionDescription: {
      color: c.onMediaText,
      fontSize: fontSize.bodySmall,
      fontWeight: fontWeight.regular,
      lineHeight: 21,
      textAlign: "center",
    },
    permissionButton: {
      marginTop: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: c.onMediaFillStrong,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.md,
    },
    permissionButtonText: {
      color: c.black,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
    disabled: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.72,
    },
  });
