import { ActionSheet } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";

type ChatRoomMoreMenuProps = {
  isBlocking: boolean;
  isBlockConfirmOpen: boolean;
  isMenuOpen: boolean;
  nickname: string;
  onBlock: () => void;
  onCloseBlockConfirm: () => void;
  onCloseMenu: () => void;
  onOpenBlockConfirm: () => void;
};

export function ChatRoomMoreMenu({
  isBlocking,
  isBlockConfirmOpen,
  isMenuOpen,
  nickname,
  onBlock,
  onCloseBlockConfirm,
  onCloseMenu,
  onOpenBlockConfirm,
}: ChatRoomMoreMenuProps) {
  return (
    <>
      <ActionSheet
        isOpen={isMenuOpen}
        items={[
          {
            danger: true,
            label: "차단하기",
            onPress: onOpenBlockConfirm,
          },
          {
            label: "취소",
            onPress: onCloseMenu,
          },
        ]}
        onClose={onCloseMenu}
      />

      <ConfirmDialog
        confirmLabel={isBlocking ? "차단 중..." : "차단"}
        danger
        description="차단하면 서로의 게시물과 채팅이 숨겨집니다."
        isOpen={isBlockConfirmOpen}
        onCancel={onCloseBlockConfirm}
        onConfirm={onBlock}
        title={`${nickname}을(를) 차단할까요?`}
      />
    </>
  );
}
