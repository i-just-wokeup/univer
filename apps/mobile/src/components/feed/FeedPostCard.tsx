import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FeedMediaCarousel } from "./FeedMediaCarousel";
import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { ExpandableText } from "../common/ExpandableText";
import { UserInline } from "../common/UserInline";
import { colors } from "../../lib/theme";
import type { FeedPost } from "../../features/feed/types";
import { getRelativeTimeLabel } from "../../lib/utils/time";

type FeedPostCardProps = {
  currentUserId?: string;
  // 피드에서 지금 보이는 카드면 영상 자동재생.
  isActive?: boolean;
  isBookmarked?: boolean;
  isLiked: boolean;
  onBlockUser?: (userId: string) => void;
  onBookmark?: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onLike: (postId: string) => void;
  onReport?: (postId: string) => void;
  onShare?: (post: FeedPost) => void;
  onUserPress: (nickname: string) => void;
  // 영상 영역 탭 시(릴스 상세 이동용).
  onVideoPress?: (postId: string) => void;
  post: FeedPost;
};

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }

  return `${count}`;
}

export function FeedPostCard({
  currentUserId = "",
  isActive = false,
  isBookmarked = false,
  isLiked,
  onBlockUser,
  onBookmark,
  onComment,
  onDelete,
  onLike,
  onReport,
  onShare,
  onUserPress,
  onVideoPress,
  post,
}: FeedPostCardProps) {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
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
    <View style={styles.card}>
      <View style={styles.header}>
        <UserInline
          avatarSize={34}
          imageUrl={post.user.avatar_url}
          meta={`${post.user.department} · ${getRelativeTimeLabel(post.created_at)}`}
          nickname={post.user.nickname}
          nicknameSize={14}
          onPress={onUserPress}
          style={styles.userInline}
        />
        <Pressable
          accessibilityLabel="게시물 더보기"
          accessibilityRole="button"
          onPress={() => setIsActionSheetOpen(true)}
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <MoreHorizontal color={colors.textFaint} size={22} strokeWidth={2.2} />
        </Pressable>
      </View>

      <FeedMediaCarousel
        aspectRatio={post.aspect_ratio}
        isActive={isActive}
        media={post.media}
        onDoubleLike={() => {
          // 인스타식: 더블탭은 좋아요만(이미 좋아요면 애니메이션만).
          if (!isLiked) {
            onLike(post.id);
          }
        }}
        onVideoPress={onVideoPress ? () => onVideoPress(post.id) : undefined}
      />

      <View
        style={[styles.actionRow, post.content ? styles.actionRowTight : null]}
      >
        <View style={styles.leftActions}>
          <Pressable onPress={() => onLike(post.id)} style={styles.actionButton}>
            <Heart
              color={isLiked ? colors.danger : colors.text}
              fill={isLiked ? colors.danger : "transparent"}
              size={26}
              strokeWidth={2}
            />
            <Text style={styles.actionText}>{formatCount(post.likes_count)}</Text>
          </Pressable>
          <Pressable
            onPress={() => onComment(post.id)}
            style={styles.actionButton}
          >
            <MessageCircle color={colors.text} size={25} strokeWidth={2} />
            <Text style={styles.actionText}>{formatCount(post.comments_count)}</Text>
          </Pressable>
          {onShare ? (
            <Pressable
              accessibilityLabel="게시물 공유"
              accessibilityRole="button"
              onPress={() => onShare(post)}
              style={styles.actionButton}
            >
              <Send color={colors.text} size={23} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={isBookmarked ? "저장 취소" : "게시물 저장"}
          accessibilityRole="button"
          onPress={() => onBookmark?.(post.id)}
          style={({ pressed }) => [
            styles.bookmarkButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Bookmark
            color={colors.text}
            fill={isBookmarked ? colors.text : "transparent"}
            size={25}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      {post.content ? (
        <View style={styles.contentWrap}>
          <ExpandableText
            collapsedLines={3}
            moreStyle={styles.contentMore}
            textStyle={styles.content}
          >
            <Text style={styles.contentNickname}>{post.user.nickname} </Text>
            {post.content}
          </ExpandableText>
        </View>
      ) : null}

      <ActionSheet
        isOpen={isActionSheetOpen}
        items={actionSheetItems}
        onClose={() => setIsActionSheetOpen(false)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  userInline: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 11,
  },
  // 본문 있는 글은 아이콘과 본문을 더 붙인다(본문 없는 글은 위 11 여백 유지).
  actionRowTight: {
    paddingBottom: 6,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  contentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  content: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  contentMore: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  contentNickname: {
    fontWeight: "900",
  },
  bookmarkButton: {
    minHeight: 40,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    minHeight: 40,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.62,
  },
});
