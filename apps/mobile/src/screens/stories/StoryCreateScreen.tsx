import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { ArrowRight, ChevronLeft, Palette } from "lucide-react-native";
import { useEffect, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import { StoryCamera } from "../../components/stories/StoryCamera";
import { StoryMediaFrame } from "../../components/stories/StoryMediaFrame";
import { StoryVideoView } from "../../components/stories/StoryVideoView";
import { STORY_BACKGROUND_COLORS } from "../../features/stories/backgroundColors";
import { useStoryCreate } from "../../features/stories/useStoryCreate";
import { useStableInsets } from "../../lib/useStableInsets";
import { colors } from "../../lib/theme";

export function StoryCreateScreen() {
  const router = useRouter();
  const insets = useStableInsets();
  const [isColorSheetOpen, setIsColorSheetOpen] = useState(false);
  const {
    backgroundColor,
    captured,
    errorMessage,
    isSubmitting,
    retake,
    setBackgroundColor,
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
    <View style={styles.previewScreen}>
      <StatusBar style="light" backgroundColor={colors.black} />

      {captured.kind === "video" ? (
        <StoryVideoView
          backgroundColor={backgroundColor}
          isActive={!isSubmitting}
          key={captured.uri}
          loop
          style={{ marginTop: insets.top + 6 }}
          uri={captured.uri}
        />
      ) : (
        <StoryMediaFrame
          backgroundColor={backgroundColor}
          imageUrl={captured.uri}
          style={{ marginTop: insets.top + 6 }}
        />
      )}

      <LinearGradient
        colors={[colors.scrimMed, "transparent"]}
        pointerEvents="none"
        style={styles.scrimTop}
      />
      <LinearGradient
        colors={["transparent", colors.scrimMed]}
        pointerEvents="none"
        style={styles.scrimBottom}
      />

      <SafeAreaView edges={["top"]} style={styles.topOverlay}>
        <Pressable
          accessibilityLabel="다시 촬영"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={retake}
          style={({ pressed }) => [
            styles.overlayIconButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <ChevronLeft color={colors.white} size={30} strokeWidth={2.8} />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={["top"]} style={styles.sideToolbar}>
        <Pressable
          accessibilityLabel="배경색 선택"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => setIsColorSheetOpen(true)}
          style={({ pressed }) => [
            styles.overlayIconButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Palette color={colors.white} size={24} strokeWidth={2.4} />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.bottomOverlay}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <View style={styles.bottomControls}>
          <View style={styles.visibilityWrap}>
            <VisibilityPicker onChange={setVisibility} value={visibility} />
          </View>
          <Pressable
            accessibilityLabel="스토리 공유"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              void handleSubmit();
            }}
            style={({ pressed }) => [
              styles.shareButton,
              isSubmitting ? styles.disabledButton : null,
              pressed && !isSubmitting ? styles.pressed : null,
            ]}
          >
            {isSubmitting ? (
              <Text style={styles.shareText}>공유 중</Text>
            ) : (
              <ArrowRight color={colors.white} size={26} strokeWidth={2.8} />
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {isColorSheetOpen ? (
        <View style={styles.sheetLayer}>
          <Pressable
            accessibilityLabel="배경색 선택 닫기"
            style={StyleSheet.absoluteFill}
            onPress={() => setIsColorSheetOpen(false)}
          />
          <SafeAreaView edges={["bottom"]} style={styles.colorSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>배경 색상</Text>
            <View style={styles.sheetPalette}>
              {STORY_BACKGROUND_COLORS.map((color) => {
                const isSelected = backgroundColor === color;

                return (
                  <Pressable
                    accessibilityLabel={`스토리 배경색 ${color}`}
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    key={color}
                    onPress={() => {
                      setBackgroundColor(color);
                      setIsColorSheetOpen(false);
                    }}
                    style={[
                      styles.colorButton,
                      isSelected ? styles.colorButtonSelected : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color },
                        color === "#FFFFFF" ? styles.lightSwatch : null,
                      ]}
                    />
                  </Pressable>
                );
              })}
            </View>
          </SafeAreaView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  previewScreen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrimTop: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 150,
  },
  scrimBottom: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 180,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sideToolbar: {
    position: "absolute",
    top: 0,
    right: 0,
    gap: 12,
    paddingTop: 82,
    paddingRight: 14,
  },
  overlayIconButton: {
    height: 46,
    width: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: colors.scrimWeak,
  },
  bottomOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bottomControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visibilityWrap: {
    flex: 1,
  },
  shareButton: {
    minWidth: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
  },
  shareText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.45,
  },
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: colors.scrimWeak,
  },
  colorSheet: {
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.mediaSheetGlassSoft,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  sheetHandle: {
    alignSelf: "center",
    height: 4,
    width: 44,
    borderRadius: 999,
    backgroundColor: colors.onMediaFill,
  },
  sheetTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  sheetPalette: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colorButton: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorButtonSelected: {
    borderColor: colors.white,
  },
  colorSwatch: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  lightSwatch: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.scrimWeak,
  },
  errorText: {
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.dangerTint,
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
