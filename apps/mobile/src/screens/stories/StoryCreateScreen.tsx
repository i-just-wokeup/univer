import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Images, SwitchCamera, X, Zap, ZapOff } from "lucide-react-native";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import { createStory, uploadStoryImage } from "../../features/stories/api";
import type { StoryVisibility } from "../../features/stories/types";
import { colors } from "../../lib/theme";

export function StoryCreateScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [isCapturing, setIsCapturing] = useState(false);
  const [visibility, setVisibility] = useState<StoryVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCapture() {
    if (isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
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
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setCapturedUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!capturedUri || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const imageUrl = await uploadStoryImage(capturedUri);
      await createStory(imageUrl, visibility);

      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "스토리 업로드에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // 미리보기 모드: 찍거나 고른 사진을 확인하고 공개범위 선택 후 공유한다.
  if (capturedUri) {
    return (
      <SafeAreaView edges={["top"]} style={styles.previewScreen}>
        <View style={styles.previewHeader}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => setCapturedUri(null)}
            style={({ pressed }) => [
              styles.headerButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.cancelText}>다시</Text>
          </Pressable>
          <Text style={styles.headerTitle}>새 스토리</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            style={({ pressed }) => [
              styles.submitButton,
              isSubmitting ? styles.disabledButton : null,
              pressed && !isSubmitting ? styles.pressed : null,
            ]}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? "공유 중" : "공유"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.previewBody}>
          <View style={styles.preview}>
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: capturedUri }}
              style={styles.previewImage}
            />
          </View>

          <View style={styles.controls}>
            <Text style={styles.sectionTitle}>공개 범위</Text>
            <VisibilityPicker onChange={setVisibility} value={visibility} />
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
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
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.permissionCancelText}>취소</Text>
        </Pressable>
      </View>
    );
  }

  // 카메라 모드: 라이브 프리뷰 + 촬영/전환/플래시/갤러리.
  return (
    <View style={styles.cameraScreen}>
      <CameraView
        facing={facing}
        flash={flash}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={["top"]} style={styles.topControls}>
        <Pressable
          accessibilityLabel="닫기"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
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
          onPress={() =>
            setFacing((current) => (current === "back" ? "front" : "back"))
          }
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
    backgroundColor: "rgba(0,0,0,0.32)",
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
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  captureOuter: {
    height: 78,
    width: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: "rgba(255,255,255,0.25)",
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
    backgroundColor: "rgba(255,59,78,0.92)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraErrorText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
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
    fontSize: 15,
    fontWeight: "700",
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
    fontSize: 15,
    fontWeight: "900",
  },
  permissionAltText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  permissionCancelText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "700",
  },
  previewScreen: {
    flex: 1,
    backgroundColor: colors.text,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerButton: {
    minWidth: 58,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  submitButton: {
    minWidth: 58,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.4,
  },
  submitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  previewBody: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  preview: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: colors.black,
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  controls: {
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
  },
});
