import { StyleSheet, View } from "react-native";

import type { PostLibraryMediaType } from "../../features/feed/postMediaLibrary";
import type { PostLibraryPermissionState } from "../../features/feed/usePostMediaLibrarySource";
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
  assetCount: number;
  canRequestPermission: boolean;
  errorMessage: string;
  isLoading: boolean;
  mediaType?: PostLibraryMediaType;
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  permissionState: PostLibraryPermissionState;
};

export function resolvePostMediaPickerState({
  canRequestPermission,
  errorMessage,
  isLoading,
  mediaType = "photo",
  onOpenSettings,
  onRequestPermission,
  permissionState,
  assetCount,
}: ResolvePostMediaPickerStateParams): PostMediaPickerStateConfig | null {
  const mediaLabel = mediaType === "video" ? "영상" : "사진";

  if (permissionState === "checking" || (isLoading && assetCount === 0)) {
    return {
      message: `기기의 최신 ${mediaLabel}을 불러오고 있습니다.`,
      title: `${mediaLabel} 불러오는 중`,
      type: "loading",
    };
  }

  if (permissionState === "unavailable") {
    return {
      message: `이 기기에서는 ${mediaLabel} 보관함을 사용할 수 없습니다.`,
      title: `${mediaLabel}을 열 수 없습니다`,
      type: "error",
    };
  }

  if (permissionState === "denied") {
    return {
      actionLabel: canRequestPermission ? "권한 허용" : "설정 열기",
      message: canRequestPermission
        ? `새 게시물에 올릴 ${mediaLabel}을 선택하려면 접근 권한이 필요합니다.`
        : `기기 설정에서 ${mediaLabel} 접근 권한을 허용해 주세요.`,
      onAction: canRequestPermission ? onRequestPermission : onOpenSettings,
      title: `${mediaLabel} 접근 권한이 필요합니다`,
      type: "error",
    };
  }

  if (permissionState === "limited" && assetCount === 0) {
    return {
      actionLabel: `${mediaLabel} 선택`,
      message: `현재 앱에 허용된 ${mediaLabel}이 없습니다. 기기 보관함에서 사용할 ${mediaLabel}을 추가해 주세요.`,
      onAction: onRequestPermission,
      title: `${mediaLabel} 접근 범위가 제한되어 있습니다`,
      type: "error",
    };
  }

  if (errorMessage && assetCount === 0) {
    return {
      actionLabel: "다시 시도",
      message: errorMessage,
      onAction: onRequestPermission,
      title: `${mediaLabel}을 불러오지 못했습니다`,
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
