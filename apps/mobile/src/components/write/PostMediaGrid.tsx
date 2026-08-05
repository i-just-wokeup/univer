import { Image } from "expo-image";
import { Images } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

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
import { StateView } from "../common/StateView";

const COLUMN_COUNT = 3;
const GRID_GAP = 2;

type PostMediaGridProps = {
  canRequestPermission: boolean;
  disabled: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isMultiSelect: boolean;
  onLoadMore: () => void;
  onOpenSettings: () => void;
  onRequestPermission: () => void;
  onSelectPhoto: (photo: PostLibraryPhoto) => void;
  onToggleMultiSelect: () => void;
  permissionState: PostLibraryPermissionState;
  photos: PostLibraryPhoto[];
  selectedIndexes: ReadonlyMap<string, number>;
};

export function PostMediaGrid({
  canRequestPermission,
  disabled,
  errorMessage,
  hasNextPage,
  isLoading,
  isLoadingMore,
  isMultiSelect,
  onLoadMore,
  onOpenSettings,
  onRequestPermission,
  onSelectPhoto,
  onToggleMultiSelect,
  permissionState,
  photos,
  selectedIndexes,
}: PostMediaGridProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const itemSize = (width - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

  if (permissionState === "checking" || (isLoading && photos.length === 0)) {
    return (
      <View style={styles.stateContainer}>
        <StateView
          message="기기의 최신 사진을 불러오고 있습니다."
          title="사진 불러오는 중"
          type="loading"
        />
      </View>
    );
  }

  if (permissionState === "unavailable") {
    return (
      <View style={styles.stateContainer}>
        <StateView
          message="이 기기에서는 사진 보관함을 사용할 수 없습니다."
          title="사진을 열 수 없습니다"
          type="error"
        />
      </View>
    );
  }

  if (permissionState === "denied") {
    return (
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
    );
  }

  if (errorMessage && photos.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <StateView
          actionLabel="다시 시도"
          message={errorMessage}
          onAction={onRequestPermission}
          title="사진을 불러오지 못했습니다"
          type="error"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      {errorMessage ? (
        <Text numberOfLines={2} style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      <FlatList
        columnWrapperStyle={styles.row}
        contentInsetAdjustmentBehavior="never"
        data={photos}
        extraData={selectedIndexes}
        keyExtractor={(photo) => photo.id}
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
              onPress={() => onSelectPhoto(item)}
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
                  <Text style={styles.selectionBadgeText}>{selectionIndex}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: c.accentSoft,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: c.accentSoft,
  },
  toolbar: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
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
