import { Image } from "expo-image";
import { VideoView } from "expo-video";
import { Play } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DoubleTapLike } from "../common/DoubleTapLike";
import { colors } from "../../lib/theme";
import type { FeedPost, PostMedia } from "../../features/feed/types";
import { ReelActions } from "./ReelActions";
import { ReelFooter } from "./ReelFooter";
import { ReelMoreMenu } from "./ReelMoreMenu";
import { useReelVideoPlayer } from "./useReelVideoPlayer";

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
  onShare: () => void;
  onToggleMute: () => void;
  post: FeedPost;
  width: number;
};

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
  onShare,
  onToggleMute,
  post,
  width,
}: ReelItemProps) {
  // getVideo는 매 렌더 새 객체를 반환하므로 메모이즈(아래 effect 무한 실행 방지).
  const video = useMemo(() => getVideo(post.media), [post.media]);
  const videoUrl = video?.url ?? null;
  const isReady = video?.processing_status === "ready";
  const insets = useSafeAreaInsets();
  const { isPaused, player, togglePaused } = useReelVideoPlayer({
    isActive,
    isMuted,
    isNearActive,
    isReady,
    videoUrl,
  });

  if (!video) {
    return <View style={{ backgroundColor: colors.black, height, width }} />;
  }

  const isOwnPost = currentUserId === post.user.id;
  const shouldRenderVideo = isNearActive && isReady;

  return (
    <View style={[styles.page, { height, width }]}>
      {shouldRenderVideo ? (
        <VideoView
          contentFit="contain"
          key={videoUrl}
          nativeControls={false}
          player={player}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
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
      {/* 영상 위 오버레이 — 단일 탭=일시정지/재생, 더블탭=좋아요(중앙 하트) */}
      <DoubleTapLike
        onDoubleTap={() => {
          if (!isLiked) {
            onLike();
          }
        }}
        onSingleTap={isReady ? togglePaused : undefined}
        style={StyleSheet.absoluteFill}
      />

      {/* 일시정지 표시 — 탭을 막지 않게 pointerEvents none */}
      {isActive && isReady && isPaused ? (
        <View pointerEvents="none" style={styles.pauseOverlay}>
          <Play color="rgba(255,255,255,0.92)" fill="rgba(255,255,255,0.92)" size={62} />
        </View>
      ) : null}

      <ReelMoreMenu
        isOwnPost={isOwnPost}
        nickname={post.user.nickname}
        onBlockUser={onBlockUser}
        onDelete={onDelete}
        onReport={onReport}
        top={insets.top + 8}
      />

      <ReelActions
        bottom={insets.bottom + 96}
        commentsCount={post.comments_count}
        isBookmarked={isBookmarked}
        isLiked={isLiked}
        isMuted={isMuted}
        isReady={isReady}
        likesCount={post.likes_count}
        onBookmark={onBookmark}
        onComment={onComment}
        onLike={onLike}
        onShare={onShare}
        onToggleMute={onToggleMute}
      />

      {/* 하단 작성자 + 캡션 — 본문 길이만큼 자라는 그라데이션 패널(위쪽 경계는 페이드).
          본문 펼치면 패널이 커지며 페이드도 함께 위로 올라간다. */}
      <ReelFooter
        bottomInset={insets.bottom}
        onPressUser={onPressUser}
        post={post}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.black,
    justifyContent: "flex-end",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
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
