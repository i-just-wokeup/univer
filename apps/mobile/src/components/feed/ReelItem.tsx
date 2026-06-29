import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Bookmark, Heart, MessageCircle, Volume2, VolumeX } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../common/Avatar";
import { colors } from "../../lib/theme";
import type { FeedPost, PostMedia } from "../../features/feed/types";

type ReelItemProps = {
  height: number;
  isActive: boolean;
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
  isBookmarked,
  isLiked,
  onBookmark,
  onComment,
  onLike,
  onPressUser,
  post,
  width,
}: ReelItemProps) {
  const video = getVideo(post.media);
  const [isMuted, setIsMuted] = useState(true);

  const player = useVideoPlayer(video?.url ?? "", (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

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
      {/* 영상 위 투명 오버레이 — 네이티브 VideoView 위에서 탭(음소거 토글)을 받는다 */}
      <Pressable onPress={toggleMute} style={StyleSheet.absoluteFill} />

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
        <Pressable onPress={toggleMute} style={styles.actionButton}>
          {isMuted ? (
            <VolumeX color={colors.white} size={28} strokeWidth={2.4} />
          ) : (
            <Volume2 color={colors.white} size={28} strokeWidth={2.4} />
          )}
        </Pressable>
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
});
