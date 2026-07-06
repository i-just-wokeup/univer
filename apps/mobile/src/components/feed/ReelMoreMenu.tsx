import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { MoreHorizontal } from "lucide-react-native";

import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { colors } from "../../lib/theme";

type ReelMoreMenuProps = {
  isOwnPost: boolean;
  nickname: string;
  onBlockUser: () => void;
  onDelete: () => void;
  onReport: () => void;
  top: number;
};

export function ReelMoreMenu({
  isOwnPost,
  nickname,
  onBlockUser,
  onDelete,
  onReport,
  top,
}: ReelMoreMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const menuItems: ActionSheetItem[] = isOwnPost
    ? [
        {
          danger: true,
          label: "삭제",
          onPress: () => setIsDeleteConfirmOpen(true),
        },
        { label: "취소", onPress: () => undefined },
      ]
    : [
        {
          danger: true,
          label: "차단",
          onPress: () => setIsBlockConfirmOpen(true),
        },
        {
          danger: true,
          label: "신고",
          onPress: () => setIsReportConfirmOpen(true),
        },
        { label: "취소", onPress: () => undefined },
      ];

  return (
    <>
      {/* 우측 상단 더보기 — 신고/차단(내 영상이면 삭제). 오버레이보다 뒤에 그려 탭이 먼저 닿게 한다 */}
      <Pressable
        accessibilityLabel="더보기"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setIsMenuOpen(true)}
        style={[styles.menuButton, { top }]}
      >
        <MoreHorizontal color={colors.white} size={24} strokeWidth={2} />
      </Pressable>

      <ActionSheet
        isOpen={isMenuOpen}
        items={menuItems}
        onClose={() => setIsMenuOpen(false)}
      />
      <ConfirmDialog
        confirmLabel="차단"
        danger
        description="이 사용자의 영상이 릴스에서 숨겨집니다."
        isOpen={isBlockConfirmOpen}
        onCancel={() => setIsBlockConfirmOpen(false)}
        onConfirm={() => {
          setIsBlockConfirmOpen(false);
          onBlockUser();
        }}
        title={`${nickname} 님을 차단할까요?`}
      />
      <ConfirmDialog
        confirmLabel="신고"
        danger
        description="검토를 위해 이 영상을 신고합니다."
        isOpen={isReportConfirmOpen}
        onCancel={() => setIsReportConfirmOpen(false)}
        onConfirm={() => {
          setIsReportConfirmOpen(false);
          onReport();
        }}
        title="영상을 신고할까요?"
      />
      <ConfirmDialog
        confirmLabel="삭제"
        danger
        description="되돌릴 수 없습니다."
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete();
        }}
        title="이 영상을 삭제할까요?"
      />
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    right: 8,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
