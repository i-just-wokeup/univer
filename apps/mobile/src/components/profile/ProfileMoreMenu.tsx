import {
  ActionSheet,
  type ActionSheetItem,
} from "../common/ActionSheet";
import type { ConnectionStatus } from "../../features/profile/types";

type ProfileMoreMenuProps = {
  connectionStatus: ConnectionStatus | null;
  isFavorite: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRemoveFriend: () => void;
  onToggleFavorite: () => void;
};

export function ProfileMoreMenu({
  connectionStatus,
  isFavorite,
  isOpen,
  onClose,
  onRemoveFriend,
  onToggleFavorite,
}: ProfileMoreMenuProps) {
  const actionSheetItems: ActionSheetItem[] = [
    {
      label: isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가",
      onPress: onToggleFavorite,
    },
    ...(connectionStatus?.status === "accepted"
      ? [
          {
            danger: true,
            label: "친구 삭제",
            onPress: onRemoveFriend,
          } satisfies ActionSheetItem,
        ]
      : []),
    {
      label: "취소",
      onPress: () => {},
    },
  ];

  return <ActionSheet isOpen={isOpen} items={actionSheetItems} onClose={onClose} />;
}
