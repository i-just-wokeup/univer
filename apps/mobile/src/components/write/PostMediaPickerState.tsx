import { StyleSheet, View } from "react-native";

import type { PostLibraryPermissionState } from "../../features/feed/usePostMediaLibraryPicker";
import { useThemedStyles } from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { StateView } from "../common/StateView";

export type PostMediaPickerStateConfig = {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  title: string;
  type: "error" | "loading";
};

type ResolvePostMediaPickerStateParams = {
  canRequestPermission: boolean;
  errorMessage: string;
  isLoading: boolean;
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  permissionState: PostLibraryPermissionState;
  photoCount: number;
};

export function resolvePostMediaPickerState({
  canRequestPermission,
  errorMessage,
  isLoading,
  onOpenSettings,
  onRequestPermission,
  permissionState,
  photoCount,
}: ResolvePostMediaPickerStateParams): PostMediaPickerStateConfig | null {
  if (permissionState === "checking" || (isLoading && photoCount === 0)) {
    return {
      message: "기기의 최신 사진을 불러오고 있습니다.",
      title: "사진 불러오는 중",
      type: "loading",
    };
  }

  if (permissionState === "unavailable") {
    return {
      message: "이 기기에서는 사진 보관함을 사용할 수 없습니다.",
      title: "사진을 열 수 없습니다",
      type: "error",
    };
  }

  if (permissionState === "denied") {
    return {
      actionLabel: canRequestPermission ? "권한 허용" : "설정 열기",
      message: canRequestPermission
        ? "새 게시물에 올릴 사진을 선택하려면 접근 권한이 필요합니다."
        : "기기 설정에서 사진 접근 권한을 허용해 주세요.",
      onAction: canRequestPermission ? onRequestPermission : onOpenSettings,
      title: "사진 접근 권한이 필요합니다",
      type: "error",
    };
  }

  if (errorMessage && photoCount === 0) {
    return {
      actionLabel: "다시 시도",
      message: errorMessage,
      onAction: onRequestPermission,
      title: "사진을 불러오지 못했습니다",
      type: "error",
    };
  }

  return null;
}

export function PostMediaPickerState({
  actionLabel,
  message,
  onAction,
  title,
  type,
}: PostMediaPickerStateConfig) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <StateView
        actionLabel={actionLabel}
        message={message}
        onAction={onAction}
        title={title}
        type={type}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
});
