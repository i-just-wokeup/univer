import { CameraView } from "expo-camera";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

// 의도: iOS 는 ratio 를 지원하지 않아 기본 세션이 1920x1080(207만 화소)으로 잡혔다.
// 게시물 사진으로 쓰기엔 너무 낮아 pictureSize 로 4K 16:9 를 지정한다.
// 실측(아이폰 12)에서 쓸 수 있는 값은
// ["3840x2160","1920x1080","1280x720","640x480","352x288","Photo","High","Medium","Low"].
// "Photo"(1200만·4:3)가 더 높지만 비율이 Android(16:9)와 달라져 쓰지 않는다.
// Android 는 ratio="16:9" 로 이미 2252x4000 이 나오므로 지정하지 않는다
// (pictureSize 를 주면 ratio 가 무시된다).
const IOS_PICTURE_SIZE = Platform.OS === "ios" ? "3840x2160" : undefined;

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
      {/* 의도: ratio·mirror·zoom 전달 방식은 전부 사고로 정해진 값이다. DECISIONS 참고 */}
      <CameraView
        animateShutter={false}
        facing={facing}
        flash={flash}
        mirror
        mode="picture"
        onCameraReady={() => setIsCameraReady(true)}
        pictureSize={IOS_PICTURE_SIZE}
        onMountError={(event) => {
          setErrorMessage(event.message || "카메라를 시작하지 못했습니다.");
        }}
        ratio="16:9"
        ref={cameraRef}
        style={styles.camera}
        zoom={enableZoom ? zoom : 0}
      />

      {/* 의도: 제스처는 CameraView 형제인 투명 View에서 받는다.
          카메라 뷰를 직접 감싸면 줌뿐 아니라 촬영까지 죽는다. 되돌리지 말 것 */}
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
      justifyContent: "center",
    },
    // 의도: iOS 는 ratio 를 지원하지 않아 미리보기가 화면을 꽉 채운다.
    // 그런데 takePictureAsync 는 "scaled to match the preview" 라서
    // 사진까지 화면 비율(실측 888x1920)로 찍혔다. 미리보기를 9:16 으로
    // 묶으면 사진도 따라와 Android(ratio="16:9")와 같은 범위가 된다.
    // Android 는 ratio 로 이미 맞아 있으므로 건드리지 않는다.
    camera:
      Platform.OS === "ios"
        ? { width: "100%", aspectRatio: 9 / 16 }
        : StyleSheet.absoluteFillObject,
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
