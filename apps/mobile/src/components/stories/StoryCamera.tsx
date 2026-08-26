import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Images, SwitchCamera, X, Zap, ZapOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { StoryCaptureMedia } from "../../features/stories/useStoryCreate";
import { colors, fontSize, fontWeight } from "../../lib/theme";

type StoryCameraProps = {
  onClose: () => void;
  onSelected: (media: StoryCaptureMedia) => void;
};

const STORY_ASPECT_RATIO = 9 / 16;

async function cropCapturedPhotoToStory(uri: string) {
  const decodedImage = await ImageManipulator.manipulate(uri).renderAsync();
  let portraitImage = decodedImage;

  // 기본 EXIF 보정 뒤에도 가로 픽셀이 남는 기기는 세로로 정규화한다.
  if (decodedImage.width > decodedImage.height) {
    const rotation = ImageManipulator.manipulate(decodedImage);
    rotation.rotate(90);
    portraitImage = await rotation.renderAsync();
  }

  const sourceRatio = portraitImage.width / portraitImage.height;
  const cropHeight =
    sourceRatio > STORY_ASPECT_RATIO
      ? portraitImage.height - (portraitImage.height % 16)
      : ((portraitImage.width - (portraitImage.width % 9)) * 16) / 9;
  const cropWidth = (cropHeight * 9) / 16;
  const crop = ImageManipulator.manipulate(portraitImage);

  crop.crop({
    originX: Math.floor((portraitImage.width - cropWidth) / 2),
    originY: Math.floor((portraitImage.height - cropHeight) / 2),
    width: cropWidth,
    height: cropHeight,
  });

  const croppedImage = await crop.renderAsync();
  return croppedImage.saveAsync({ compress: 1, format: SaveFormat.JPEG });
}

// 스토리용 카메라/갤러리 입력. 촬영하거나 고른 사진 uri를 onSelected로 넘긴다.
export function StoryCamera({ onClose, onSelected }: StoryCameraProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCapture() {
    if (isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      // 인스타처럼 셔터음 없이 촬영(흰 플래시는 CameraView animateShutter={false}).
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        shutterSound: false,
      });

      if (photo?.uri) {
        const croppedPhoto = await cropCapturedPhotoToStory(photo.uri);
        onSelected({
          durationSeconds: null,
          kind: "image",
          uri: croppedPhoto.uri,
        });
      }
    } catch {
      setErrorMessage("사진을 촬영하지 못했습니다.");
    } finally {
      setIsCapturing(false);
    }
  }

  async function handlePickImage() {
    setErrorMessage("");

    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!mediaPermission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images", "videos"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    const isVideo = asset.type === "video";

    onSelected({
      // asset.duration은 밀리초 → 초로.
      durationSeconds:
        isVideo && asset.duration ? Math.round(asset.duration / 1000) : null,
      kind: isVideo ? "video" : "image",
      uri: asset.uri,
    });
  }

  // 카메라 권한이 없으면 권한 요청 + 갤러리 선택 안내를 보여준다.
  if (!permission || !permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Text style={styles.permissionText}>
          스토리를 찍으려면 카메라 권한이 필요합니다.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void requestPermission();
          }}
          style={({ pressed }) => [
            styles.permissionButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.permissionButtonText}>카메라 권한 허용</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void handlePickImage();
          }}
        >
          <Text style={styles.permissionAltText}>갤러리에서 선택</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose}>
          <Text style={styles.permissionCancelText}>취소</Text>
        </Pressable>
      </View>
    );
  }

  // 카메라 모드: 라이브 프리뷰 + 촬영/전환/플래시/갤러리.
  return (
    <View style={styles.cameraScreen}>
      <CameraView
        animateShutter={false}
        facing={facing}
        flash={flash}
        onCameraReady={() => setIsCameraReady(true)}
        onMountError={() => {
          setErrorMessage("카메라를 시작하지 못했습니다.");
        }}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
      />
      {!isCameraReady ? (
        <View pointerEvents="none" style={styles.cameraLoadingCover} />
      ) : null}

      <SafeAreaView edges={["top"]} style={styles.topControls}>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={onClose}
          style={styles.iconButton}
        >
          <X color={colors.white} size={26} strokeWidth={2.6} />
        </Pressable>
        <Pressable
          accessibilityLabel="플래시 전환"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setFlash((current) => (current === "off" ? "on" : "off"))}
          style={styles.iconButton}
        >
          {flash === "on" ? (
            <Zap color={colors.white} fill={colors.white} size={24} />
          ) : (
            <ZapOff color={colors.white} size={24} strokeWidth={2.4} />
          )}
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomControls}>
        <Pressable
          accessibilityLabel="갤러리에서 선택"
          accessibilityRole="button"
          onPress={() => {
            void handlePickImage();
          }}
          style={styles.sideButton}
        >
          <Images color={colors.white} size={28} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          accessibilityLabel="촬영"
          accessibilityRole="button"
          disabled={isCapturing}
          onPress={() => {
            void handleCapture();
          }}
          style={styles.captureOuter}
        >
          <View style={styles.captureInner} />
        </Pressable>

        <Pressable
          accessibilityLabel="전후면 전환"
          accessibilityRole="button"
          onPress={() => {
            setIsCameraReady(false);
            setFacing((current) => (current === "back" ? "front" : "back"));
          }}
          style={styles.sideButton}
        >
          <SwitchCamera color={colors.white} size={28} strokeWidth={2.2} />
        </Pressable>
      </SafeAreaView>

      {errorMessage ? (
        <View style={styles.cameraError}>
          <Text style={styles.cameraErrorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cameraScreen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  cameraLoadingCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black,
  },
  topControls: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  iconButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.scrimWeak,
  },
  bottomControls: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingBottom: 18,
  },
  sideButton: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.scrimWeak,
  },
  captureOuter: {
    height: 78,
    width: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.onMediaFill,
  },
  captureInner: {
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },
  cameraError: {
    position: "absolute",
    right: 24,
    bottom: 120,
    left: 24,
    borderRadius: 14,
    backgroundColor: colors.dangerSolid,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraErrorText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  permissionScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: colors.text,
    paddingHorizontal: 32,
  },
  permissionText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
    textAlign: "center",
  },
  permissionButton: {
    borderRadius: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  permissionAltText: {
    color: colors.white,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  permissionCancelText: {
    color: colors.onMediaTextFaint,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
  },
  pressed: {
    opacity: 0.7,
  },
});
