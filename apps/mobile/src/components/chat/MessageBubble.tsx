import { Image } from "expo-image";
import { Play } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Message, SharedPostPreview } from "../../features/chat/api";
import { colors } from "../../lib/theme";
import { formatChatTime } from "../../lib/utils/time";

type MessageBubbleProps = {
  isMine: boolean;
  message: Message;
  onPostPress?: (postId: string, mediaType: SharedPostPreview["mediaType"]) => void;
};

// 버블을 탭하면 시간(내 메시지는 읽음/전송됨까지)을 보여준다. (웹의 hover와 동일 역할)
export function MessageBubble({
  isMine,
  message,
  onPostPress,
}: MessageBubbleProps) {
  const [showMeta, setShowMeta] = useState(false);

  const meta = isMine
    ? `${message.read_at ? "읽음" : "전송됨"} · ${formatChatTime(message.created_at)}`
    : formatChatTime(message.created_at);

  return (
    <View style={[styles.row, isMine ? styles.mineRow : styles.otherRow]}>
      <View style={[styles.contentWrap, isMine ? styles.mineWrap : styles.otherWrap]}>
        {message.message_type === "post" ? (
          <PostMessageCard
            isMine={isMine}
            message={message}
            onMetaToggle={() => setShowMeta((current) => !current)}
            onPostPress={onPostPress}
          />
        ) : (
          <Pressable
            onPress={() => setShowMeta((current) => !current)}
            style={[
              styles.bubble,
              isMine ? styles.mineBubble : styles.otherBubble,
            ]}
          >
            <Text
              style={[
                styles.content,
                isMine ? styles.mineText : styles.otherText,
              ]}
            >
              {message.content}
            </Text>
          </Pressable>
        )}
        {showMeta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </View>
  );
}

type PostMessageCardProps = {
  isMine: boolean;
  message: Message;
  onMetaToggle: () => void;
  onPostPress?: (postId: string, mediaType: SharedPostPreview["mediaType"]) => void;
};

function PostMessageCard({
  isMine,
  message,
  onMetaToggle,
  onPostPress,
}: PostMessageCardProps) {
  const post = message.sharedPost;

  if (!post) {
    return (
      <Pressable
        onPress={onMetaToggle}
        style={[
          styles.bubble,
          styles.unavailableBubble,
          isMine ? styles.mineBubble : styles.otherBubble,
        ]}
      >
        <Text
          style={[styles.content, isMine ? styles.mineText : styles.otherText]}
        >
          볼 수 없는 게시물입니다.
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onLongPress={onMetaToggle}
      onPress={() => onPostPress?.(post.id, post.mediaType)}
      style={({ pressed }) => [
        styles.postCard,
        isMine ? styles.minePostCard : styles.otherPostCard,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.postThumbWrap}>
        {post.thumbnailUrl ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={`${message.id}-${post.id}`}
            source={{ uri: post.thumbnailUrl }}
            style={styles.postThumb}
          />
        ) : (
          <View style={styles.postThumbFallback}>
            <Text style={styles.postThumbFallbackText}>게시물</Text>
          </View>
        )}
        {post.mediaType === "video" ? (
          <View style={styles.playBadge}>
            <Play color={colors.white} fill={colors.white} size={20} />
          </View>
        ) : null}
      </View>
      <View style={styles.postBody}>
        <Text
          numberOfLines={1}
          style={[styles.postAuthor, isMine ? styles.minePostAuthor : null]}
        >
          {post.authorNickname}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.postContent, isMine ? styles.minePostContent : null]}
        >
          {post.content?.trim() || "게시물을 공유했습니다."}
        </Text>
        {post.mediaType === "video" ? (
          <Text style={[styles.postMeta, isMine ? styles.minePostMeta : null]}>
            영상 게시물
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 3,
  },
  mineRow: {
    justifyContent: "flex-end",
  },
  otherRow: {
    justifyContent: "flex-start",
  },
  contentWrap: {
    maxWidth: "78%",
    gap: 3,
  },
  mineWrap: {
    alignItems: "flex-end",
  },
  otherWrap: {
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  mineBubble: {
    borderTopRightRadius: 5,
    backgroundColor: colors.accent,
  },
  otherBubble: {
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: colors.white,
  },
  content: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  mineText: {
    color: colors.white,
  },
  otherText: {
    color: colors.text,
  },
  meta: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
  },
  unavailableBubble: {
    opacity: 0.9,
  },
  postCard: {
    width: 238,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
  },
  minePostCard: {
    borderTopRightRadius: 5,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: colors.accent,
  },
  otherPostCard: {
    borderTopLeftRadius: 5,
    borderColor: "rgba(124,58,237,0.12)",
    backgroundColor: colors.white,
  },
  postThumbWrap: {
    position: "relative",
  },
  postThumb: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.accentSoft,
  },
  playBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 44,
    height: 44,
    marginTop: -22,
    marginLeft: -22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  postThumbFallback: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft,
  },
  postThumbFallbackText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  postBody: {
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  postAuthor: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  minePostAuthor: {
    color: colors.white,
  },
  postContent: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  minePostContent: {
    color: "rgba(255,255,255,0.86)",
  },
  postMeta: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: "800",
  },
  minePostMeta: {
    color: "rgba(255,255,255,0.72)",
  },
  pressed: {
    opacity: 0.72,
  },
});
