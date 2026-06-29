import { useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import { StoryCamera } from "../../components/stories/StoryCamera";
import { StoryMediaFrame } from "../../components/stories/StoryMediaFrame";
import { StoryVideoView } from "../../components/stories/StoryVideoView";
import { useStoryCreate } from "../../features/stories/useStoryCreate";
import { colors } from "../../lib/theme";

export function StoryCreateScreen() {
  const router = useRouter();
  const {
    captured,
    errorMessage,
    isSubmitting,
    retake,
    setCaptured,
    setVisibility,
    submit,
    visibility,
  } = useStoryCreate();

  async function handleSubmit() {
    const uploaded = await submit();
    if (uploaded) {
      router.back();
    }
  }

  // 미리보기 상태에서 하드웨어 뒤로가기 = 홈으로 나가지 않고 카메라로 복귀(다시 찍기).
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (captured) {
        retake();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [captured, retake]);

  // 카메라 모드: 촬영하거나 고른 미디어를 받으면 미리보기로 전환.
  if (!captured) {
    return (
      <StoryCamera onClose={() => router.back()} onSelected={setCaptured} />
    );
  }

  // 미리보기 모드: 사진 확인 + 공개범위 선택 후 공유.
  return (
    <SafeAreaView edges={["top"]} style={styles.previewScreen}>
      <View style={styles.previewHeader}>
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={retake}
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
          {captured.kind === "video" ? (
            <StoryVideoView
              key={captured.uri}
              loop
              style={styles.previewFrame}
              uri={captured.uri}
            />
          ) : (
            <StoryMediaFrame imageUrl={captured.uri} style={styles.previewFrame} />
          )}
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

const styles = StyleSheet.create({
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
    alignItems: "center",
    justifyContent: "center",
  },
  previewFrame: {
    borderRadius: 20,
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
