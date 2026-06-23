import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { VisibilityPicker } from "../../components/common/VisibilityPicker";
import { PostAspectRatioPicker } from "../../components/write/PostAspectRatioPicker";
import { PostImageUploader } from "../../components/write/PostImageUploader";
import {
  createPost,
  uploadPostImages,
} from "../../features/feed/api";
import type {
  PostAspectRatio,
  PostVisibility,
} from "../../features/feed/types";
import { colors } from "../../lib/theme";

const MAX_IMAGES = 10;

function detectAspectRatio(width?: number, height?: number): PostAspectRatio {
  if (!width || !height) {
    return "square";
  }

  const ratio = width / height;

  if (ratio >= 1.1) {
    return "landscape";
  }

  if (ratio <= 0.9) {
    return "portrait";
  }

  return "square";
}

export function WriteScreen() {
  const router = useRouter();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<PostAspectRatio>("square");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const canSubmit =
    !isSubmitting && (imageUris.length > 0 || content.trim().length > 0);
  const hasDraft = imageUris.length > 0 || content.trim().length > 0;

  function resetForm() {
    setImageUris([]);
    setAspectRatio("square");
    setContent("");
    setVisibility("public");
    setErrorMessage("");
  }

  function handleCancel() {
    if (isSubmitting) {
      return;
    }

    if (hasDraft) {
      setIsDiscardOpen(true);
      return;
    }

    router.back();
  }

  function handleConfirmDiscard() {
    setIsDiscardOpen(false);
    resetForm();
    router.back();
  }

  async function handlePickImages() {
    setErrorMessage("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setErrorMessage("사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 1,
      selectionLimit: MAX_IMAGES,
    });

    if (result.canceled) {
      return;
    }

    const selectedAssets = result.assets.slice(
      0,
      Math.max(0, MAX_IMAGES - imageUris.length),
    );

    if (selectedAssets.length === 0) {
      return;
    }

    if (imageUris.length === 0) {
      const firstAsset = selectedAssets[0];
      setAspectRatio(detectAspectRatio(firstAsset.width, firstAsset.height));
    }

    setImageUris((currentUris) => [
      ...currentUris,
      ...selectedAssets.map((asset) => asset.uri),
    ]);
  }

  function handleRemoveImage(index: number) {
    setImageUris((currentUris) =>
      currentUris.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const imageUrls =
        imageUris.length > 0 ? await uploadPostImages(imageUris) : [];
      await createPost({
        aspectRatio,
        content,
        imageUrls,
        visibility,
      });

      resetForm();
      router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "게시물 작성에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.headerButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
          <Text style={styles.headerTitle}>새 게시물</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => {
              void handleSubmit();
            }}
            style={({ pressed }) => [
              styles.submitButton,
              !canSubmit ? styles.disabledButton : null,
              pressed && canSubmit ? styles.pressed : null,
            ]}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? "게시 중" : "게시"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <PostImageUploader
              aspectRatio={aspectRatio}
              imageUris={imageUris}
              maxCount={MAX_IMAGES}
              onAdd={() => {
                void handlePickImages();
              }}
              onRemove={handleRemoveImage}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>내용</Text>
            <TextInput
              editable={!isSubmitting}
              multiline
              onChangeText={setContent}
              placeholder="지금 무슨 일이 있었나요?"
              placeholderTextColor={colors.textFaint}
              style={styles.textInput}
              textAlignVertical="top"
              value={content}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>비율</Text>
            <PostAspectRatioPicker
              onChange={setAspectRatio}
              value={aspectRatio}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>공개 범위</Text>
            <VisibilityPicker onChange={setVisibility} value={visibility} />
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        cancelLabel="계속 작성"
        confirmLabel="나가기"
        danger
        description="지금 나가면 작성 중인 내용이 사라집니다."
        isOpen={isDiscardOpen}
        onCancel={() => setIsDiscardOpen(false)}
        onConfirm={handleConfirmDiscard}
        title="작성을 취소할까요?"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  keyboardView: {
    flex: 1,
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
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  headerTitle: {
    color: colors.text,
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
  content: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 22,
    backgroundColor: colors.card,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  textInput: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.72,
  },
});
