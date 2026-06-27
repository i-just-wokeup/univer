import { Heart } from "lucide-react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Avatar } from "../common/Avatar";
import type { StoryViewer } from "../../features/stories/types";
import { colors } from "../../lib/theme";

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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={isOpen}
    >
      <Pressable onPress={onClose} style={styles.sheetOverlay}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <View style={styles.sheetHandle} />
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
                    <Heart color={colors.danger} fill={colors.danger} size={18} />
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: "center",
    height: 4,
    width: 40,
    borderRadius: 999,
    backgroundColor: "rgba(20,22,30,0.18)",
  },
  sheetTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetEmpty: {
    paddingVertical: 28,
    color: colors.textFaint,
    fontSize: 14,
    fontWeight: "700",
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
    fontSize: 14,
    fontWeight: "800",
  },
});
