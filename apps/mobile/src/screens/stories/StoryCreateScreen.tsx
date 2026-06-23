import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ImagePlus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import { createStory, uploadStoryImage } from "../../features/stories/api";
import type { StoryVisibility } from "../../features/stories/types";
import { colors } from "../../lib/theme";

export function StoryCreateScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<StoryVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // 진입 시 갤러리를 자동으로 한 번만 연다.
  const hasAutoOpenedRef = useRef(false);

  const pickImage = useCallback(async () => {
    setErrorMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return false;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return false;
    }

    setImageUri(result.assets[0].uri);
    return true;
  }, []);

  useEffect(() => {
    if (hasAutoOpenedRef.current) {
      return;
    }

    hasAutoOpenedRef.current = true;

    void (async () => {
      const picked = await pickImage();

      // 처음 진입에서 아무것도 고르지 않으면 이전 화면으로 돌아간다.
      if (!picked) {
        router.back();
      }
    })();
  }, [pickImage, router]);

  async function handleSubmit() {
    if (!imageUri || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const imageUrl = await uploadStoryImage(imageUri);
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

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.cancelText}>취소</Text>
        </Pressable>
        <Text style={styles.headerTitle}>새 스토리</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!imageUri || isSubmitting}
          onPress={() => {
            void handleSubmit();
          }}
          style={({ pressed }) => [
            styles.submitButton,
            !imageUri || isSubmitting ? styles.disabledButton : null,
            pressed && imageUri && !isSubmitting ? styles.pressed : null,
          ]}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? "공유 중" : "공유"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Pressable
          accessibilityLabel="사진 다시 선택"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => {
            void pickImage();
          }}
          style={styles.preview}
        >
          {imageUri ? (
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              source={{ uri: imageUri }}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewEmpty}>
              <ImagePlus color={colors.white} size={30} strokeWidth={2.6} />
              <Text style={styles.previewEmptyText}>사진 선택</Text>
            </View>
          )}
        </Pressable>

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
  screen: {
    flex: 1,
    backgroundColor: colors.text,
  },
  header: {
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
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  preview: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#000000",
  },
  previewImage: {
    height: "100%",
    width: "100%",
  },
  previewEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  previewEmptyText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
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
