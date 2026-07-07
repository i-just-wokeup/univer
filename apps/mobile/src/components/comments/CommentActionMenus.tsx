import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";
import type { Comment } from "../../features/comments/types";

type CommentActionMenusProps = {
  currentUserId: string | null;
  menuComment: Comment | null;
  onCloseMenu: () => void;
  onCloseReport: () => void;
  onConfirmReport: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onOpenReport: (commentId: string) => void;
  reportCommentId: string | null;
};

// 삭제/신고 메뉴 조합. 실제 UI는 공용 ActionSheet/ConfirmDialog를 재사용한다.
export function CommentActionMenus({
  currentUserId,
  menuComment,
  onCloseMenu,
  onCloseReport,
  onConfirmReport,
  onDelete,
  onOpenReport,
  reportCommentId,
}: CommentActionMenusProps) {
  const commentMenuItems: ActionSheetItem[] = menuComment
    ? [
        currentUserId === menuComment.user.id
          ? {
              danger: true,
              label: "삭제",
              onPress: () => onDelete(menuComment.id),
            }
          : {
              danger: true,
              label: "신고",
              onPress: () => onOpenReport(menuComment.id),
            },
        { label: "취소", onPress: () => undefined },
      ]
    : [];

  return (
    <>
      <ActionSheet
        isOpen={menuComment !== null}
        items={commentMenuItems}
        onClose={onCloseMenu}
      />
      <ConfirmDialog
        confirmLabel="신고"
        danger
        description="검토를 위해 이 댓글을 신고합니다."
        isOpen={reportCommentId !== null}
        onCancel={onCloseReport}
        onConfirm={() => {
          if (reportCommentId) {
            onConfirmReport(reportCommentId);
          }
        }}
        title="댓글을 신고할까요?"
      />
    </>
  );
}
