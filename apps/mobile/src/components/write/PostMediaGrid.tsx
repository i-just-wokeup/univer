import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Images } from "lucide-react-native";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentRef } from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import type { PostAspectRatio } from "../../features/feed/types";
import type {
  PostLibraryPermissionState,
  PostLibraryPhoto,
} from "../../features/feed/usePostMediaLibraryPicker";
import {
  fontSize,
  fontWeight,
  useTheme,
  useThemedStyles,
} from "../../lib/theme";
import type { ThemeColors } from "../../lib/theme";
import { getAspectRatioValue } from "../../lib/utils/aspectRatio";
import { StateView } from "../common/StateView";
import { PostMediaPreview } from "./PostMediaPreview";

const COLUMN_COUNT = 3;
const GRID_GAP = 2;
const TOOLBAR_HEIGHT = 50;

type PostMediaGridProps = {
  aspectRatio: PostAspectRatio;
  canRequestPermission: boolean;
  disabled: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMultiSelect: boolean;
  onCycleAspectRatio: () => void;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  onSelectPhoto: (photo: PostLibraryPhoto) => void;
  onToggleMultiSelect: () => void;
  permissionState: PostLibraryPermissionState;
  photos: PostLibraryPhoto[];
  previewPhoto: PostLibraryPhoto | null;
  selectedIndexes: ReadonlyMap<string, number>;
};

export function PostMediaGrid({
  aspectRatio,
  canRequestPermission,
  disabled,
  errorMessage,
  hasNextPage,
  isLoading,
  isLoadingMore,
  isMultiSelect,
  onCycleAspectRatio,
  onLoadMore,
  onOpenSettings,
  onRequestPermission,
  onSelectPhoto,
  onToggleMultiSelect,
  permissionState,
  photos,
  previewPhoto,
  selectedIndexes,
}: PostMediaGridProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const itemSize = (width - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
  const previewHeight = width / getAspectRatioValue(aspectRatio);
  const sheetRef = useRef<ComponentRef<typeof BottomSheet>>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const minimumSheetHeight = TOOLBAR_HEIGHT + itemSize;
  const collapsedSheetHeight = Math.min(
    Math.max(containerHeight - 1, 1),
    Math.max(minimumSheetHeight, containerHeight - previewHeight),
  );
  const snapPoints = useMemo(
    () => [collapsedSheetHeight, containerHeight],
    [collapsedSheetHeight, containerHeight],
  );
  const preview = (
    <PostMediaPreview
      aspectRatio={aspectRatio}
      onCycleAspectRatio={onCycleAspectRatio}
      photo={previewPhoto}
    />
  );

  function handleSelectPhoto(photo: PostLibraryPhoto) {
    onSelectPhoto(photo);

    if (!isMultiSelect) {
      requestAnimationFrame(() => {
        sheetRef.current?.collapse();
      });
    }
  }

  function handleContainerLayout(event: LayoutChangeEvent) {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setContainerHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  }

  const renderSheetHandle = useCallback(
    () => (
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>최근 항목</Text>
        <Pressable
          accessibilityLabel={
            isMultiSelect ? "여러 사진 선택 끄기" : "여러 사진 선택"
          }
          accessibilityRole="button"
          disabled={disabled}
          onPress={onToggleMultiSelect}
          style={({ pressed }) => [
            styles.multiSelectButton,
            isMultiSelect ? styles.multiSelectButtonActive : null,
            pressed ? styles.pressed : null,
          ]}
        >
          <Images
            color={isMultiSelect ? colors.onAccent : colors.text}
            size={18}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.multiSelectText,
              isMultiSelect ? styles.multiSelectTextActive : null,
            ]}
          >
            선택
          </Text>
        </Pressable>
      </View>
    ),
    [
      colors.onAccent,
      colors.text,
      disabled,
      isMultiSelect,
      onToggleMultiSelect,
      styles,
    ],
  );

  if (permissionState === "checking" || (isLoading && photos.length === 0)) {
    return (
      <View style={styles.container}>
        {preview}
        <View style={styles.stateContainer}>
          <StateView
            message="기기의 최신 사진을 불러오고 있습니다."
            title="사진 불러오는 중"
            type="loading"
          />
        </View>
      </View>
    );
  }

  if (permissionState === "unavailable") {
    return (
      <View style={styles.container}>
        {preview}
        <View style={styles.stateContainer}>
          <StateView
            message="이 기기에서는 사진 보관함을 사용할 수 없습니다."
            title="사진을 열 수 없습니다"
            type="error"
          />
        </View>
      </View>
    );
  }

  if (permissionState === "denied") {
    return (
      <View style={styles.container}>
        {preview}
        <View style={styles.stateContainer}>
          <StateView
            actionLabel={canRequestPermission ? "권한 허용" : "설정 열기"}
            message={
              canRequestPermission
                ? "새 게시물에 올릴 사진을 선택하려면 접근 권한이 필요합니다."
                : "기기 설정에서 사진 접근 권한을 허용해 주세요."
            }
            onAction={canRequestPermission ? onRequestPermission : onOpenSettings}
            title="사진 접근 권한이 필요합니다"
            type="error"
          />
        </View>
      </View>
    );
  }

  if (errorMessage && photos.length === 0) {
    return (
      <View style={styles.container}>
        {preview}
        <View style={styles.stateContainer}>
          <StateView
            actionLabel="다시 시도"
            message={errorMessage}
            onAction={onRequestPermission}
            title="사진을 불러오지 못했습니다"
            type="error"
          />
        </View>
      </View>
    );
  }

  return (
    <View onLayout={handleContainerLayout} style={styles.container}>
      {preview}

      {containerHeight > 1 ? (
        <BottomSheet
          animateOnMount={false}
          backgroundStyle={styles.sheetBackground}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose={false}
          handleComponent={renderSheetHandle}
          index={0}
          ref={sheetRef}
          snapPoints={snapPoints}
          style={styles.sheet}
        >
          <BottomSheetFlatList
            columnWrapperStyle={styles.row}
            contentInsetAdjustmentBehavior="never"
            data={photos}
            extraData={selectedIndexes}
            keyExtractor={(photo) => photo.id}
            ListHeaderComponent={
              errorMessage ? (
                <Text numberOfLines={2} style={styles.errorText}>
                  {errorMessage}
                </Text>
              ) : null
            }
            ListEmptyComponent={
              <StateView
                message="기기 사진 보관함에 표시할 사진이 없습니다."
                title="사진이 없습니다"
              />
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator
                  color={colors.accent}
                  style={styles.footerLoader}
                />
              ) : null
            }
            numColumns={COLUMN_COUNT}
            onEndReached={hasNextPage ? onLoadMore : undefined}
            onEndReachedThreshold={0.6}
            renderItem={({ item }) => {
              const selectionIndex = selectedIndexes.get(item.id);
              const isSelected = selectionIndex !== undefined;

              return (
                <Pressable
                  accessibilityLabel={
                    selectionIndex
                      ? `${selectionIndex}번째로 선택된 사진`
                      : "사진 선택"
                  }
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={() => handleSelectPhoto(item)}
                  style={({ pressed }) => [
                    styles.photoButton,
                    { height: itemSize, width: itemSize },
                    pressed ? styles.photoPressed : null,
                  ]}
                >
                  <Image
                    cachePolicy="memory-disk"
                    contentFit="cover"
                    recyclingKey={item.id}
                    source={{ uri: item.uri }}
                    style={styles.photo}
                    transition={80}
                  />
                  {isSelected ? <View style={styles.selectedOutline} /> : null}
                  {selectionIndex ? (
                    <View style={styles.selectionBadge}>
                      <Text style={styles.selectionBadgeText}>
                        {selectionIndex}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </BottomSheet>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    backgroundColor: c.accentSoft,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: c.accentSoft,
  },
  sheet: {
    zIndex: 2,
  },
  sheetBackground: {
    borderRadius: 0,
    backgroundColor: c.accentSoft,
  },
  toolbarTitle: {
    color: c.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.heavy,
  },
  multiSelectButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 17,
    backgroundColor: c.overlayInk,
    paddingHorizontal: 12,
  },
  multiSelectButtonActive: {
    backgroundColor: c.accent,
  },
  multiSelectText: {
    color: c.text,
    fontSize: fontSize.label,
    fontWeight: fontWeight.semibold,
  },
  multiSelectTextActive: {
    color: c.onAccent,
  },
  errorText: {
    color: c.danger,
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  list: {
    flex: 1,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  photoButton: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: c.imagePlaceholder,
  },
  photo: {
    height: "100%",
    width: "100%",
  },
  selectedOutline: {
    ...StyleSheet.absoluteFillObject,
    borderColor: c.accent,
    borderWidth: 3,
  },
  selectionBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    height: 26,
    minWidth: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: c.accent,
    paddingHorizontal: 5,
  },
  selectionBadgeText: {
    color: c.onAccent,
    fontSize: fontSize.label,
    fontWeight: fontWeight.heavy,
    fontVariant: ["tabular-nums"],
  },
  footerLoader: {
    paddingVertical: 18,
  },
  pressed: {
    opacity: 0.7,
  },
  photoPressed: {
    opacity: 0.82,
  },
});
