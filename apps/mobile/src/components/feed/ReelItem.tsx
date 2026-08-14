import { Image } from "expo-image";
import { VideoView } from "expo-video";
import { Play } from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DoubleTapLike } from "../common/DoubleTapLike";
import { triggerLightHaptic } from "../../lib/haptics";
import { colors, fontSize, fontWeight } from "../../lib/theme";
import type { FeedPost, PostMedia } from "../../features/feed/types";
import { ReelActions } from "./ReelActions";
import { ReelFooter } from "./ReelFooter";
import { ReelMoreMenu } from "./ReelMoreMenu";
import { ReelProgressBar } from "./ReelProgressBar";
import { ReelWatchTracker } from "./ReelWatchTracker";
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
  onBlockUser: (userId: string) => void;
  onBookmark: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete: (postId: string) => void;
  onLike: (postId: string) => void;
  onPressUser: (nickname: string) => void;
  onReport: (postId: string) => void;
  onShare: (post: FeedPost) => void;
  onToggleMute: () => void;
  post: FeedPost;
  width: number;
};

function getVideo(media: PostMedia[]) {
  return media.find((item) => item.type === "video") ?? null;
}

// 릴스 1개(세로 풀스크린). 활성이면 자동재생(loop), 탭하면 일시정지/재생, 음소거 버튼은 전역 토글.
// 우측 좋아요/댓글/저장 세로 버튼 + 하단 작성자/캡션 오버레이.
function ReelItemComponent({
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
  const [hasMountedVideo, setHasMountedVideo] = useState(false);
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);
  const insets = useSafeAreaInsets();
  const { isPaused, player, togglePaused } = useReelVideoPlayer({
    isActive,
    isMuted,
    isNearActive,
    isReady,
    videoUrl,
  });

  useEffect(() => {
    setHasMountedVideo(false);
    setHasRenderedFirstFrame(false);
  }, [videoUrl, isReady]);

  const shouldRenderVideo = isNearActive && isReady;
  const shouldMountVideo = isReady && (isNearActive || hasMountedVideo);

  useEffect(() => {
    if (!shouldRenderVideo) {
      return undefined;
    }

    setHasMountedVideo(true);
    setHasRenderedFirstFrame(false);

    // 일부 expo-video 조합에서 onFirstFrameRender가 늦거나 누락되면
    // 썸네일이 영원히 영상을 덮는다. 안전망으로 일정 시간 뒤 커버를 걷는다.
    const fallbackTimer = setTimeout(() => {
      setHasRenderedFirstFrame(true);
    }, 1200);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [shouldRenderVideo, videoUrl]);

  const handleBlockUser = useCallback(() => {
    onBlockUser(post.user.id);
  }, [onBlockUser, post.user.id]);
  const handleBookmark = useCallback(() => {
    onBookmark(post.id);
  }, [onBookmark, post.id]);
  const handleComment = useCallback(() => {
    onComment(post.id);
  }, [onComment, post.id]);
  const handleDelete = useCallback(() => {
    onDelete(post.id);
  }, [onDelete, post.id]);
  const handleLike = useCallback(() => {
    onLike(post.id);
  }, [onLike, post.id]);
  const handlePressUser = useCallback(() => {
    onPressUser(post.user.nickname);
  }, [onPressUser, post.user.nickname]);
  const handleReport = useCallback(() => {
    onReport(post.id);
  }, [onReport, post.id]);
  const handleShare = useCallback(() => {
    onShare(post);
  }, [onShare, post]);

  if (!video) {
    return <View style={{ backgroundColor: colors.black, height, width }} />;
  }

  const isOwnPost = currentUserId === post.user.id;

  return (
    <View style={[styles.page, { height, width }]}>
      {isReady ? (
        <ReelWatchTracker
          isActive={isActive && !isOwnPost}
          player={player}
          postId={post.id}
        />
      ) : null}
      {shouldMountVideo ? (
        <VideoView
          contentFit="contain"
          key={videoUrl}
          nativeControls={false}
          onFirstFrameRender={() => setHasRenderedFirstFrame(true)}
          player={player}
          surfaceType="textureView"
          style={StyleSheet.absoluteFill}
          useExoShutter
        />
      ) : null}
      {video.thumbnail_url && (!shouldMountVideo || !hasRenderedFirstFrame) ? (
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
            triggerLightHaptic();
            handleLike();
          }
        }}
        onSingleTap={isReady ? togglePaused : undefined}
        style={StyleSheet.absoluteFill}
      />

      {/* 일시정지 표시 — 탭을 막지 않게 pointerEvents none */}
      {isActive && isReady && isPaused ? (
        <View pointerEvents="none" style={styles.pauseOverlay}>
          <Play color={colors.onMediaGlyph} fill={colors.onMediaGlyph} size={62} />
        </View>
      ) : null}

      <ReelMoreMenu
        isOwnPost={isOwnPost}
        nickname={post.user.nickname}
        onBlockUser={handleBlockUser}
        onDelete={handleDelete}
        onReport={handleReport}
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
        onBookmark={handleBookmark}
        onComment={handleComment}
        onLike={handleLike}
        onShare={handleShare}
        onToggleMute={onToggleMute}
      />

      {/* 하단 작성자 + 캡션 — 본문 길이만큼 자라는 그라데이션 패널(위쪽 경계는 페이드).
          본문 펼치면 패널이 커지며 페이드도 함께 위로 올라간다. */}
      <ReelFooter
        bottomInset={insets.bottom}
        onPressUser={handlePressUser}
        post={post}
      />

      {/* 하단 진행바 — 활성 릴스에서만. 표시 전용(탭 안 막음). */}
      {isActive && isReady ? (
        <ReelProgressBar bottomInset={insets.bottom} player={player} />
      ) : null}
    </View>
  );
}

export const ReelItem = memo(ReelItemComponent);

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
    backgroundColor: colors.scrimWeak,
  },
  processingText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.scrimStrong,
    color: colors.white,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.heavy,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
