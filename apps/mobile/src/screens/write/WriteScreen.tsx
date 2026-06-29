import { useRouter } from "expo-router";
import { Film, X } from "lucide-react-native";
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
import { StoryVideoView } from "../../components/stories/StoryVideoView";
import { PostAspectRatioPicker } from "../../components/write/PostAspectRatioPicker";
import { PostImageUploader } from "../../components/write/PostImageUploader";
import { MAX_IMAGES, useWriteForm } from "../../features/feed/useWriteForm";
import { colors } from "../../lib/theme";

export function WriteScreen() {
  const router = useRouter();
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const {
    aspectRatio,
    canSubmit,
    content,
    errorMessage,
    hasDraft,
    imageUris,
    isSubmitting,
    pickImages,
    pickVideo,
    removeImage,
    removeVideo,
    resetForm,
    selectedVideo,
    setAspectRatio,
    setContent,
    setVisibility,
    submit,
    visibility,
  } = useWriteForm();

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

  async function handleSubmit() {
    const created = await submit();
    if (created) {
      router.replace("/");
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
            {selectedVideo ? (
              <View style={styles.videoUploader}>
                <View style={styles.mediaHeader}>
                  <Text style={styles.mediaTitle}>영상</Text>
                  <Text style={styles.mediaCount}>1/1</Text>
                </View>
                <View style={styles.videoPreviewWrap}>
                  <StoryVideoView
                    key={selectedVideo.uri}
                    loop
                    style={styles.videoPreview}
                    uri={selectedVideo.uri}
                  />
                  <Pressable
                    accessibilityLabel="영상 삭제"
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={removeVideo}
                    style={({ pressed }) => [
                      styles.removeVideoButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <X color={colors.white} size={18} strokeWidth={3} />
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <PostImageUploader
                  aspectRatio={aspectRatio}
                  imageUris={imageUris}
                  maxCount={MAX_IMAGES}
                  onAdd={() => {
                    void pickImages();
                  }}
                  onRemove={removeImage}
                />
                {imageUris.length === 0 ? (
                  <Pressable
                    accessibilityLabel="영상 선택"
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={() => {
                      void pickVideo();
                    }}
                    style={({ pressed }) => [
                      styles.videoPickButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Film color={colors.accent} size={20} strokeWidth={2.5} />
                    <Text style={styles.videoPickText}>영상 선택</Text>
                  </Pressable>
                ) : null}
              </>
            )}
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
  videoUploader: {
    gap: 12,
  },
  mediaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mediaTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  mediaCount: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: "800",
  },
  videoPreviewWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.black,
  },
  videoPreview: {
    width: "100%",
    borderRadius: 20,
  },
  removeVideoButton: {
    position: "absolute",
    top: 10,
    right: 10,
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(21,22,27,0.72)",
  },
  videoPickButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.22)",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  videoPickText: {
    color: colors.accent,
    fontSize: 14,
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
