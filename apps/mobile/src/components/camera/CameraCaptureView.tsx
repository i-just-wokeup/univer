import { CameraView } from "expo-camera";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";

import type { CapturedPhoto } from "../../features/camera/useCameraCapture";
import { useCameraCapture } from "../../features/camera/useCameraCapture";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { CameraControls } from "./CameraControls";
import { CameraPermissionView } from "./CameraPermissionView";

export type CameraCaptureViewProps = {
  bottomLeftSlot?: ReactNode;
  enableZoom?: boolean;
  errorMessage?: string;
  onCaptured: (photo: CapturedPhoto) => void | Promise<void>;
  onClose: () => void;
  permissionAlternativeSlot?: ReactNode;
};

export function CameraCaptureView({
  bottomLeftSlot,
  enableZoom = false,
  errorMessage: externalErrorMessage = "",
  onCaptured,
  onClose,
  permissionAlternativeSlot,
}: CameraCaptureViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const {
    cameraRef,
    capture,
    close,
    errorMessage,
    facing,
    flash,
    isCameraReady,
    isCapturing,
    permission,
    pinchGesture,
    requestPermission,
    setErrorMessage,
    setIsCameraReady,
    switchCamera,
    toggleFlash,
    zoom,
  } = useCameraCapture({ enableZoom, onCaptured, onClose });

  if (!permission?.granted) {
    return (
      <CameraPermissionView
        alternativeSlot={permissionAlternativeSlot}
        onClose={close}
        onRequestPermission={() => {
          void requestPermission();
        }}
        permission={permission}
      />
    );
  }

  const visibleErrorMessage = errorMessage || externalErrorMessage;

  return (
    <View style={styles.screen}>
      <CameraView
        animateShutter={false}
        facing={facing}
        flash={flash}
        mirror
        mode="picture"
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={(event) => {
          setErrorMessage(event.message || "카메라를 시작하지 못했습니다.");
        }}
        ratio="16:9"
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        zoom={enableZoom ? zoom : 0}
      />

      {enableZoom ? (
        <GestureDetector gesture={pinchGesture}>
          <View style={styles.gestureSurface} />
        </GestureDetector>
      ) : null}

      {!isCameraReady ? (
        <View pointerEvents="none" style={styles.loadingCover}>
          <ActivityIndicator color={colors.onMediaGlyph} size="large" />
        </View>
      ) : null}

      <CameraControls
        bottomLeftSlot={bottomLeftSlot}
        facing={facing}
        flash={flash}
        isCameraReady={isCameraReady}
        isCapturing={isCapturing}
        onCapture={() => {
          void capture();
        }}
        onClose={close}
        onSwitchCamera={switchCamera}
        onToggleFlash={toggleFlash}
      />

      {visibleErrorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{visibleErrorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.black,
    },
    gestureSurface: {
      ...StyleSheet.absoluteFillObject,
    },
    loadingCover: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.black,
    },
    errorBanner: {
      position: "absolute",
      right: 24,
      bottom: 124,
      left: 24,
      borderRadius: 12,
      backgroundColor: c.dangerSolid,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    errorText: {
      color: c.white,
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      textAlign: "center",
    },
  });
