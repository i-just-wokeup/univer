import { useState } from "react";

import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";
import type { FeedPost } from "../../features/feed/types";

type FeedPostMoreMenuProps = {
  currentUserId: string;
  isBookmarked: boolean;
  isOpen: boolean;
  onBlockUser?: (userId: string) => void;
  onBookmark?: (postId: string) => void;
  onClose: () => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onShare?: (post: FeedPost) => void;
  post: FeedPost;
};

export function FeedPostMoreMenu({
  currentUserId,
  isBookmarked,
  isOpen,
  onBlockUser,
  onBookmark,
  onClose,
  onDelete,
  onReport,
  onShare,
  post,
}: FeedPostMoreMenuProps) {
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const isOwnPost = currentUserId === post.user.id;
  const actionSheetItems: ActionSheetItem[] = [
    ...(onBookmark
      ? [
          {
            label: isBookmarked ? "저장 취소" : "저장",
            onPress: () => onBookmark(post.id),
          } satisfies ActionSheetItem,
        ]
      : []),
    ...(onShare
      ? [
          {
            label: "공유",
            onPress: () => onShare(post),
          } satisfies ActionSheetItem,
        ]
      : []),
    ...(isOwnPost && onDelete
      ? [
          {
            danger: true,
            label: "삭제",
            onPress: () => setIsDeleteConfirmOpen(true),
          } satisfies ActionSheetItem,
        ]
      : []),
    ...(!isOwnPost && onBlockUser
      ? [
          {
            danger: true,
            label: "차단",
            onPress: () => setIsBlockConfirmOpen(true),
          } satisfies ActionSheetItem,
        ]
      : []),
    ...(!isOwnPost && onReport
      ? [
          {
            danger: true,
            label: "신고",
            onPress: () => setIsReportConfirmOpen(true),
          } satisfies ActionSheetItem,
        ]
      : []),
    {
      label: "취소",
      onPress: () => undefined,
    },
  ];

  return (
    <>
      <ActionSheet
        isOpen={isOpen}
        items={actionSheetItems}
        onClose={onClose}
      />
      <ConfirmDialog
        confirmLabel="차단"
        danger
        description="이 사용자의 게시물이 피드에서 숨겨집니다."
        isOpen={isBlockConfirmOpen}
        onCancel={() => setIsBlockConfirmOpen(false)}
        onConfirm={() => {
          setIsBlockConfirmOpen(false);
          onBlockUser?.(post.user.id);
        }}
        title={`${post.user.nickname} 님을 차단할까요?`}
      />
      <ConfirmDialog
        confirmLabel="삭제"
        danger
        description="되돌릴 수 없습니다."
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          setIsDeleteConfirmOpen(false);
          onDelete?.(post.id);
        }}
        title="이 게시물을 삭제할까요?"
      />
      <ConfirmDialog
        confirmLabel="신고"
        danger
        description="검토를 위해 이 게시물을 신고합니다."
        isOpen={isReportConfirmOpen}
        onCancel={() => setIsReportConfirmOpen(false)}
        onConfirm={() => {
          setIsReportConfirmOpen(false);
          onReport?.(post.id);
        }}
        title="게시물을 신고할까요?"
      />
    </>
  );
}
