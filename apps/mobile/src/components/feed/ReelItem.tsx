import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Bookmark, Heart, MessageCircle, Volume2, VolumeX } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { colors } from "../../lib/theme";
import type { FeedPost, PostMedia } from "../../features/feed/types";

type ReelItemProps = {
  height: number;
  isActive: boolean;
  // 활성 ±1 이내면 영상 플레이어에 실제 소스를 물리고, 멀면 source=null로 메모리 해제.
  isNearActive: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  onBookmark: () => void;
  onComment: () => void;
  onLike: () => void;
  onPressUser: () => void;
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

// 릴스 1개(세로 풀스크린). 활성이면 음소거 자동재생(loop), 탭하면 음소거 토글.
// 우측 좋아요/댓글/저장 세로 버튼 + 하단 작성자/캡션 오버레이.
export function ReelItem({
  height,
  isActive,
  isNearActive,
  isBookmarked,
  isLiked,
  onBookmark,
  onComment,
  onLike,
  onPressUser,
  post,
  width,
}: ReelItemProps) {
  // getVideo는 매 렌더 새 객체를 반환하므로 메모이즈(아래 effect 무한 실행 방지).
  const video = useMemo(() => getVideo(post.media), [post.media]);
  const videoUrl = video?.url ?? null;
  const isReady = video?.processing_status === "ready";
  const [isMuted, setIsMuted] = useState(true);

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

  useEffect(() => {
    try {
      if (isActive && isReady) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // 플레이어가 이미 release된 경우 무시.
    }
  }, [isActive, isReady, player]);

  function toggleMute() {
    const next = !isMuted;
    player.muted = next;
    setIsMuted(next);
  }

  if (!video) {
    return <View style={{ backgroundColor: colors.black, height, width }} />;
  }

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
            {video.processing_status === "failed" ? "영상 처리 실패" : "영상 처리 중"}
          </Text>
        </View>
      ) : null}
      {/* 영상 위 투명 오버레이 — 네이티브 VideoView 위에서 탭(음소거 토글)을 받는다 */}
      <Pressable
        onPress={isReady ? toggleMute : undefined}
        style={StyleSheet.absoluteFill}
      />

      {/* 우측 액션 버튼 */}
      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actionButton}>
          <Heart
            color={isLiked ? colors.danger : colors.white}
            fill={isLiked ? colors.danger : "transparent"}
            size={34}
            strokeWidth={2.4}
          />
          <Text style={styles.actionText}>{formatCount(post.likes_count)}</Text>
        </Pressable>
        <Pressable onPress={onComment} style={styles.actionButton}>
          <MessageCircle color={colors.white} size={32} strokeWidth={2.4} />
          <Text style={styles.actionText}>
            {formatCount(post.comments_count)}
          </Text>
        </Pressable>
        <Pressable onPress={onBookmark} style={styles.actionButton}>
          <Bookmark
            color={colors.white}
            fill={isBookmarked ? colors.white : "transparent"}
            size={31}
            strokeWidth={2.4}
          />
        </Pressable>
        {isReady ? (
          <Pressable onPress={toggleMute} style={styles.actionButton}>
            {isMuted ? (
              <VolumeX color={colors.white} size={28} strokeWidth={2.4} />
            ) : (
              <Volume2 color={colors.white} size={28} strokeWidth={2.4} />
            )}
          </Pressable>
        ) : null}
      </View>

      {/* 하단 작성자 + 캡션 */}
      <View style={styles.bottom}>
        <Pressable onPress={onPressUser} style={styles.userRow}>
          <Avatar
            imageUrl={post.user.avatar_url}
            label={post.user.nickname}
            size={36}
          />
          <Text style={styles.nickname}>{post.user.nickname}</Text>
        </Pressable>
        {post.content ? (
          <Text numberOfLines={2} style={styles.caption}>
            {post.content}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.black,
    justifyContent: "flex-end",
  },
  actions: {
    position: "absolute",
    right: 12,
    bottom: 130,
    alignItems: "center",
    gap: 22,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
  },
  bottom: {
    position: "absolute",
    left: 16,
    right: 80,
    bottom: 40,
    gap: 8,
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
  },
  caption: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
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
