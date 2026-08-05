import { ArrowLeft, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { PostLibraryAlbumOption } from "../../features/feed/postMediaLibrary";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { PostMediaAlbumGrid } from "./PostMediaAlbumGrid";
import { PostMediaAlbumOverview } from "./PostMediaAlbumOverview";

type AlbumPickerMode = "overview" | "all";

type PostMediaAlbumPickerProps = {
  albums: PostLibraryAlbumOption[];
  errorMessage: string;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (albumId: string | null) => void;
  selectedAlbumId: string | null;
  visible: boolean;
};

export function PostMediaAlbumPicker({
  albums,
  errorMessage,
  isLoading,
  onClose,
  onRetry,
  onSelect,
  selectedAlbumId,
  visible,
}: PostMediaAlbumPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AlbumPickerMode>("overview");

  function handleClose() {
    setMode("overview");
    onClose();
  }

  function handleSelect(albumId: string | null) {
    onSelect(albumId);
    handleClose();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="앨범 선택 닫기"
          accessibilityRole="button"
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.panel,
            mode === "all" ? styles.panelExpanded : styles.panelOverview,
            { paddingBottom: insets.bottom + 12 },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerSide}>
              {mode === "all" ? (
                <Pressable
                  accessibilityLabel="앨범 미리보기로 돌아가기"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setMode("overview")}
                  style={({ pressed }) => (pressed ? styles.pressed : null)}
                >
                  <ArrowLeft color={colors.text} size={24} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.headerTitleRow}>
              <Text numberOfLines={1} style={styles.headerTitle}>
                {mode === "all" ? "사진첩" : "사진첩 선택"}
              </Text>
              {isLoading ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : null}
            </View>

            <View style={[styles.headerSide, styles.headerSideRight]}>
              <Pressable
                accessibilityLabel="앨범 선택 닫기"
                accessibilityRole="button"
                hitSlop={8}
                onPress={handleClose}
                style={({ pressed }) => pressed ? styles.pressed : null}
              >
                <X color={colors.text} size={24} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorRow}>
              <Text numberOfLines={2} style={styles.errorText}>
                {errorMessage}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}

          {albums.length === 0 && isLoading ? (
            <ActivityIndicator color={colors.accent} style={styles.loader} />
          ) : mode === "all" ? (
            <PostMediaAlbumGrid
              albums={albums}
              onSelect={handleSelect}
              selectedAlbumId={selectedAlbumId}
            />
          ) : (
            <PostMediaAlbumOverview
              albums={albums}
              onSelect={handleSelect}
              onShowAll={() => setMode("all")}
              selectedAlbumId={selectedAlbumId}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: c.scrimMed,
  },
  panel: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: c.navBackground,
  },
  panelOverview: {
    height: "58%",
  },
  panelExpanded: {
    height: "92%",
  },
  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 40,
    alignItems: "flex-start",
  },
  headerSideRight: {
    alignItems: "flex-end",
  },
  headerTitleRow: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: {
    flexShrink: 1,
    color: c.text,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  errorText: {
    flex: 1,
    color: c.danger,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
  },
  retryButton: {
    minHeight: 32,
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: c.overlayInk,
    paddingHorizontal: 12,
  },
  retryText: {
    color: c.text,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  loader: {
    flex: 1,
  },
  pressed: {
    opacity: 0.65,
  },
});
