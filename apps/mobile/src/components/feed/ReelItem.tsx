import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionSheet, type ActionSheetItem } from "../common/ActionSheet";
import { Avatar } from "../common/Avatar";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { ExpandableText } from "../common/ExpandableText";
import { colors } from "../../lib/theme";
import type { FeedPost, PostMedia } from "../../features/feed/types";

type ReelItemProps = {
  // 본인 영상이면 메뉴에 삭제, 아니면 차단/신고를 노출한다.
  currentUserId: string;
  height: number;
  isActive: boolean;
  // 활성 ±1 이내면 영상 플레이어에 실제 소스를 물리고, 멀면 source=null로 메모리 해제.
  isNearActive: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  // 음소거는 릴스 전체가 공유(부모가 소유) — 한 번 켜면 다음 영상에서도 유지.
  isMuted: boolean;
  onBlockUser: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onDelete: () => void;
  onLike: () => void;
  onPressUser: () => void;
  onReport: () => void;
  onToggleMute: () => void;
  post: FeedPost;
  width: number;
};

function formatCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천`;
  }
  return `${count}`;
}

function getVideo(media: PostMedia[]) {
  return media.find((item) => item.type === "video") ?? null;
}

// 릴스 1개(세로 풀스크린). 활성이면 자동재생(loop), 탭하면 일시정지/재생, 음소거 버튼은 전역 토글.
// 우측 좋아요/댓글/저장 세로 버튼 + 하단 작성자/캡션 오버레이.
export function ReelItem({
  currentUserId,
  height,
  isActive,
  isNearActive,
  isBookmarked,
  isLiked,
  isMuted,
  onBlockUser,
  onBookmark,
  onComment,
  onDelete,
  onLike,
  onPressUser,
  onReport,
  onToggleMute,
  post,
  width,
}: ReelItemProps) {
  // getVideo는 매 렌더 새 객체를 반환하므로 메모이즈(아래 effect 무한 실행 방지).
  const video = useMemo(() => getVideo(post.media), [post.media]);
  const videoUrl = video?.url ?? null;
  const isReady = video?.processing_status === "ready";
  // 탭 일시정지는 이 영상에만 유지(음소거는 전역이라 부모가 소유).
  const [isPaused, setIsPaused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isReportConfirmOpen, setIsReportConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // 초기엔 빈 소스. 가까워지면 replace로 실제 영상을, 멀어지면 null로 교체해 메모리를 푼다.
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    // OOM 방지: 무압축 원본 영상을 통째로 메모리에 올리지 않게 버퍼를 제한한다(안드로이드).
    instance.bufferOptions = {
      maxBufferBytes: 8 * 1024 * 1024, // 8MB까지만 버퍼
      preferredForwardBufferDuration: 5, // 앞 5초만 미리 받기
      minBufferForPlayback: 1,
    };
  });

  // 활성 ±1만 소스를 물린다(Mux/TikTok 방식: 창 밖은 source=null로 메모리 해제).
  // 의존성은 문자열 videoUrl(안정)로 — video 객체를 쓰면 매 렌더 재실행돼 폭주한다.
  // replaceAsync로 메인 스레드 블락(UI 프리즈)을 피한다.
  useEffect(() => {
    void player
      .replaceAsync(isNearActive && isReady && videoUrl ? videoUrl : null)
      .catch(() => undefined);
  }, [isNearActive, isReady, player, videoUrl]);

  // 전역 음소거 상태를 플레이어에 반영.
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // 화면 밖으로 벗어나면 탭 일시정지는 초기화(다시 활성될 때 자동재생).
  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    try {
      if (isActive && isReady && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // 플레이어가 이미 release된 경우 무시.
    }
  }, [isActive, isPaused, isReady, player]);

  if (!video) {
    return <View style={{ backgroundColor: colors.black, height, width }} />;
  }

  const isOwnPost = currentUserId === post.user.id;
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
    <View style={[styles.page, { height, width }]}>
      <VideoView
        contentFit="contain"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />
      {!isActive && video.thumbnail_url ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={{ uri: video.thumbnail_url }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {!isReady && video.thumbnail_url ? (
        <Image
          cachePolicy="memory-disk"
          contentFit="contain"
          source={{ uri: video.thumbnail_url }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {!isReady ? (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>
            {video.processing_status === "failed" ? "영상 업로드 실패" : "영상 업로드 중"}
          </Text>
        </View>
      ) : null}
      {/* 영상 위 투명 오버레이 — 네이티브 VideoView 위에서 탭(일시정지/재생)을 받는다 */}
      <Pressable
        onPress={isReady ? () => setIsPaused((paused) => !paused) : undefined}
        style={StyleSheet.absoluteFill}
      />

      {/* 일시정지 표시 — 탭을 막지 않게 pointerEvents none */}
      {isActive && isReady && isPaused ? (
        <View pointerEvents="none" style={styles.pauseOverlay}>
          <Play color="rgba(255,255,255,0.92)" fill="rgba(255,255,255,0.92)" size={62} />
        </View>
      ) : null}

      {/* 우측 상단 더보기 — 신고/차단(내 영상이면 삭제). 오버레이보다 뒤에 그려 탭이 먼저 닿게 한다 */}
      <Pressable
        accessibilityLabel="더보기"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setIsMenuOpen(true)}
        style={[styles.menuButton, { top: insets.top + 8 }]}
      >
        <MoreHorizontal color={colors.white} size={26} strokeWidth={2.6} />
      </Pressable>

      {/* 하단 가독성 그라데이션 — 밝은 영상 위에서도 프로필/본문이 읽히게 */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)"]}
        pointerEvents="none"
        style={styles.bottomGradient}
      />

      {/* 우측 액션 버튼 — 모든 버튼을 아이콘 박스(고정) + 라벨 슬롯(고정)으로 맞춰 아이콘 간격을 균등하게 */}
      <View style={[styles.actions, { bottom: insets.bottom + 96 }]}>
        <Pressable hitSlop={6} onPress={onLike} style={styles.actionButton}>
          <View style={styles.iconBox}>
            <Heart
              color={isLiked ? colors.danger : colors.white}
              fill={isLiked ? colors.danger : "transparent"}
              size={32}
              strokeWidth={2.4}
            />
          </View>
          <Text style={styles.actionText}>{formatCount(post.likes_count)}</Text>
        </Pressable>
        <Pressable hitSlop={6} onPress={onComment} style={styles.actionButton}>
          <View style={styles.iconBox}>
            <MessageCircle color={colors.white} size={30} strokeWidth={2.4} />
          </View>
          <Text style={styles.actionText}>
            {formatCount(post.comments_count)}
          </Text>
        </Pressable>
        <Pressable hitSlop={6} onPress={onBookmark} style={styles.actionButton}>
          <View style={styles.iconBox}>
            <Bookmark
              color={colors.white}
              fill={isBookmarked ? colors.white : "transparent"}
              size={29}
              strokeWidth={2.4}
            />
          </View>
          <View style={styles.labelSpacer} />
        </Pressable>
        {isReady ? (
          <Pressable hitSlop={6} onPress={onToggleMute} style={styles.actionButton}>
            <View style={styles.iconBox}>
              {isMuted ? (
                <VolumeX color={colors.white} size={27} strokeWidth={2.4} />
              ) : (
                <Volume2 color={colors.white} size={27} strokeWidth={2.4} />
              )}
            </View>
            <View style={styles.labelSpacer} />
          </Pressable>
        ) : null}
      </View>

      {/* 하단 작성자 + 캡션 — 세이프에어리어 기준 고정 위치(영상/본문 길이와 무관하게 통일) */}
      <View style={[styles.bottom, { bottom: insets.bottom + 14 }]}>
        <Pressable onPress={onPressUser} style={styles.userRow}>
          <Avatar
            imageUrl={post.user.avatar_url}
            label={post.user.nickname}
            size={36}
          />
          <Text style={styles.nickname}>{post.user.nickname}</Text>
        </Pressable>
        {/* 본문 자리를 항상 확보 — 본문 유무와 상관없이 프로필 위치를 고정한다(접힘 기준) */}
        <View style={styles.captionSlot}>
          {post.content ? (
            <ExpandableText
              collapsedLines={1}
              moreStyle={styles.captionMore}
              textStyle={styles.caption}
            >
              {post.content}
            </ExpandableText>
          ) : null}
        </View>
      </View>

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
        title={`${post.user.nickname} 님을 차단할까요?`}
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
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.black,
    justifyContent: "flex-end",
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 340,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    position: "absolute",
    right: 8,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    position: "absolute",
    right: 10,
    alignItems: "center",
    gap: 14,
  },
  actionButton: {
    alignItems: "center",
    gap: 5,
  },
  // 아이콘을 고정 높이 박스에 담아 크기가 달라도 세로 리듬을 맞춘다.
  iconBox: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    height: 15,
    lineHeight: 15,
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 3,
  },
  // 숫자가 없는 버튼(저장/음소거)도 같은 높이를 차지하게 하는 빈 라벨 자리.
  labelSpacer: {
    height: 15,
  },
  bottom: {
    position: "absolute",
    left: 16,
    right: 80,
    gap: 8,
  },
  // 접힌 본문(1줄) + 더보기 높이만큼 항상 확보 → 프로필 위치 고정. 펼치면 이 이상으로 늘어남.
  captionSlot: {
    minHeight: 42,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nickname: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowRadius: 4,
  },
  caption: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowRadius: 4,
  },
  captionMore: {
    marginTop: 4,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "800",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  processingText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.66)",
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
