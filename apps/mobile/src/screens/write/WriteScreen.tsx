import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { WriteContentField } from "../../components/write/WriteContentField";
import { WriteHeader } from "../../components/write/WriteHeader";
import { WriteMediaSection } from "../../components/write/WriteMediaSection";
import { WriteSettingsSection } from "../../components/write/WriteSettingsSection";
import { useWriteForm } from "../../features/feed/useWriteForm";
import { useTheme, useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export function WriteScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
    // 영상은 업로드 후에도 인코딩이 남아 즉시 "완료"가 아니므로 홈 폴링이 완료 토스트를 띄운다.
    // 사진/글은 게시 즉시 완료이므로 홈에 신호를 넘겨 완료 토스트를 띄운다.
    const wasVideo = selectedVideo !== null;
    const created = await submit();
    if (created) {
      if (wasVideo) {
        router.replace("/");
      } else {
        router.replace({ pathname: "/", params: { posted: "1" } });
      }
    }
  }

  return (
    <ScreenContainer
      contentBackgroundColor={colors.accentSoft}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <WriteHeader
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          isVideoPost={selectedVideo !== null}
          onCancel={handleCancel}
          onSubmit={() => {
            void handleSubmit();
          }}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <WriteMediaSection
            aspectRatio={aspectRatio}
            imageUris={imageUris}
            isSubmitting={isSubmitting}
            onPickImages={() => {
              void pickImages();
            }}
            onPickVideo={() => {
              void pickVideo();
            }}
            onRemoveImage={removeImage}
            onRemoveVideo={removeVideo}
            selectedVideo={selectedVideo}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <WriteContentField
            content={content}
            disabled={isSubmitting}
            onChangeContent={setContent}
          />

          <WriteSettingsSection
            aspectRatio={aspectRatio}
            onChangeAspectRatio={setAspectRatio}
            onChangeVisibility={setVisibility}
            visibility={visibility}
          />
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
    </ScreenContainer>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.accentSoft,
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
    backgroundColor: c.navBackground,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: c.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  headerTitle: {
    color: c.text,
    fontSize: 18,
    fontWeight: "900",
  },
  submitButton: {
    minWidth: 58,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: c.accent,
    paddingHorizontal: 12,
  },
  disabledButton: {
    opacity: 0.4,
  },
  submitText: {
    color: c.onAccent,
    fontSize: 14,
    fontWeight: "900",
  },
  content: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  errorText: {
    color: c.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    paddingHorizontal: 4,
  },
});
