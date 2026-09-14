import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Icon } from "../common/Icon";
import { BottomSheet } from "../common/BottomSheet";
import { Avatar } from "../common/Avatar";
import type { StoryViewer } from "../../features/stories/types";
import { colors, fontSize, fontWeight } from "../../lib/theme";

type StoryViewersSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  viewers: StoryViewer[];
};

// 스토리 조회자 목록 바텀시트. 본인 스토리에서 "N명 봄" 탭 시 노출.
export function StoryViewersSheet({
  isOpen,
  onClose,
  viewers,
}: StoryViewersSheetProps) {
  return (
    <BottomSheet
      onClose={onClose}
      visible={isOpen}
      backdropStyle={styles.sheetOverlay}
      sheetStyle={styles.sheet}
      bottomPadding={28}
      showHandle
      handleStyle={styles.sheetHandle}
    >
      <Text style={styles.sheetTitle}>조회자 {viewers.length}명</Text>
      <ScrollView style={styles.sheetList}>
        {viewers.length === 0 ? (
          <Text style={styles.sheetEmpty}>아직 조회한 사람이 없습니다</Text>
        ) : (
          viewers.map((viewer) => (
            <View key={viewer.id} style={styles.viewerRow}>
              <Avatar
                imageUrl={viewer.avatar_url}
                label={viewer.nickname}
                size={40}
              />
              <Text style={styles.viewerName}>{viewer.nickname}</Text>
              {viewer.isLiked ? (
                <Icon name="heart" size="sm" stroke="thin" tone="danger" filled />
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    backgroundColor: colors.scrimStrong,
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: "center",
    height: 4,
    width: 40,
    borderRadius: 999,
    backgroundColor: colors.overlayInkStrong,
  },
  sheetTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: colors.text,
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.heavy,
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetEmpty: {
    paddingVertical: 28,
    color: colors.textFaint,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  viewerName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
});
