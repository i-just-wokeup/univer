import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { PostMediaPickerBody } from "../../components/write/PostMediaPickerBody";
import { PostMediaPickerHeader } from "../../components/write/PostMediaPickerHeader";
import { WriteSettingsSection } from "../../components/write/WriteSettingsSection";
import { usePostMediaLibraryPicker } from "../../features/feed/usePostMediaLibraryPicker";
import { useWriteForm } from "../../features/feed/useWriteForm";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";

export function WriteScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const router = useRouter();
  const [stage, setStage] = useState<"form" | "picker">("picker");
  const [pickerExitTarget, setPickerExitTarget] =
    useState<"form" | "route">("route");
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const allowRouteExitRef = useRef(false);
  const {
    aspectRatio,
    canSubmit,
    content,
    errorMessage,
    hasDraft,
    imageUris,
    isSubmitting,
    pickVideo,
    replaceImages,
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
  const mediaPicker = usePostMediaLibraryPicker({
    aspectRatio,
    setAspectRatio,
  });

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (allowRouteExitRef.current) {
          return;
        }

        if (stage === "form") {
          event.preventDefault();
          if (!isSubmitting) {
            setPickerExitTarget("route");
            setStage("picker");
          }
          return;
        }

        if (pickerExitTarget === "form") {
          event.preventDefault();
          mediaPicker.cancelSelectionEdit();
          setPickerExitTarget("route");
          setStage("form");
          return;
        }

        if (hasDraft) {
          event.preventDefault();
          setIsDiscardOpen(true);
        }
      }),
    [hasDraft, isSubmitting, navigation, pickerExitTarget, stage],
  );

  function handlePickerClose() {
    if (pickerExitTarget === "form") {
      mediaPicker.cancelSelectionEdit();
      setPickerExitTarget("route");
      setStage("form");
      return;
    }

    if (hasDraft) {
      setIsDiscardOpen(true);
      return;
    }

    allowRouteExitRef.current = true;
    router.back();
  }

  async function handlePickerNext() {
    const selectedImageUris = await mediaPicker.resolveSelectedImageUris();
    if (!selectedImageUris || selectedImageUris.length === 0) {
      return;
    }

    replaceImages(selectedImageUris);
    mediaPicker.commitSelectionEdit();
    setPickerExitTarget("route");
    setStage("form");
  }

  function handleCancel() {
    if (isSubmitting) {
      return;
    }

    setPickerExitTarget("route");
    setStage("picker");
  }

  function handleAddImages() {
    if (isSubmitting) {
      return;
    }

    mediaPicker.beginSelectionEdit();
    setPickerExitTarget("form");
    setStage("picker");
  }

  function handleRemoveImage(index: number) {
    removeImage(index);
    mediaPicker.removeSelectedPhoto(index);
  }

  function handleConfirmDiscard() {
    setIsDiscardOpen(false);
    resetForm();
    allowRouteExitRef.current = true;
    router.back();
  }

  async function handleSubmit() {
    // 영상은 업로드 후에도 인코딩이 남아 즉시 "완료"가 아니므로 홈 폴링이 완료 토스트를 띄운다.
    // 사진/글은 게시 즉시 완료이므로 홈에 신호를 넘겨 완료 토스트를 띄운다.
    const wasVideo = selectedVideo !== null;
    const created = await submit();
    if (created) {
      allowRouteExitRef.current = true;
      if (wasVideo) {
        router.replace("/");
      } else {
        router.replace({ pathname: "/", params: { posted: "1" } });
      }
    }
  }

  if (stage === "picker") {
    return (
      <ScreenContainer
        contentBackgroundColor={colors.accentSoft}
        edges={["top", "bottom"]}
        style={styles.screen}
      >
        <PostMediaPickerHeader
          canContinue={
            mediaPicker.selectedCount > 0 &&
            mediaPicker.permissionState === "granted" &&
            !mediaPicker.isPreparing
          }
          isPreparing={mediaPicker.isPreparing}
          onClose={handlePickerClose}
          onNext={() => {
            void handlePickerNext();
          }}
        />
        <PostMediaPickerBody
          albumErrorMessage={mediaPicker.albumErrorMessage}
          albumOptions={mediaPicker.albumOptions}
          aspectRatio={aspectRatio}
          canRequestPermission={mediaPicker.canRequestPermission}
          disabled={mediaPicker.isPreparing}
          errorMessage={mediaPicker.errorMessage}
          hasNextPage={mediaPicker.hasNextPage}
          isLoading={mediaPicker.isLoading}
          isLoadingAlbums={mediaPicker.isLoadingAlbums}
          isLoadingMore={mediaPicker.isLoadingMore}
          isMultiSelect={mediaPicker.isMultiSelect}
          onChangeCropTransform={mediaPicker.updatePreviewCropTransform}
          onCycleAspectRatio={mediaPicker.cycleAspectRatio}
          onFocusSelectedPhoto={mediaPicker.focusSelectedPhoto}
          onLoadMore={mediaPicker.loadMore}
          onOpenSettings={mediaPicker.openSettings}
          onRequestPermission={mediaPicker.requestPermission}
          onRetryAlbums={mediaPicker.retryAlbums}
          onSelectAlbum={mediaPicker.selectAlbum}
          onSelectPhoto={mediaPicker.selectPhoto}
          onToggleMultiSelect={mediaPicker.toggleMultiSelect}
          permissionState={mediaPicker.permissionState}
          photos={mediaPicker.photos}
          previewPhoto={mediaPicker.previewPhoto}
          previewCropTransform={mediaPicker.previewCropTransform}
          selectedAlbumId={mediaPicker.selectedAlbumId}
          selectedAlbumKey={mediaPicker.selectedAlbumKey}
          selectedAlbumTitle={mediaPicker.selectedAlbumTitle}
          selectedIndexes={mediaPicker.selectedIndexes}
          selectedPhotos={mediaPicker.selectedPhotos}
        />

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
            onPickImages={handleAddImages}
            onPickVideo={() => {
              void pickVideo();
            }}
            onRemoveImage={handleRemoveImage}
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
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.heavy,
  },
  headerTitle: {
    color: c.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.heavy,
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
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.heavy,
  },
  content: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  errorText: {
    color: c.danger,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    lineHeight: 19,
    paddingHorizontal: 4,
  },
});
