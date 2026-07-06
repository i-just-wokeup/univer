import { FlatList, StyleSheet, Text, View } from "react-native";

import { type ChatMessage } from "../../features/chat/useChatRoom";
import { colors } from "../../lib/theme";
import { formatChatTime } from "../../lib/utils/time";
import { MessageBubble } from "./MessageBubble";

type ChatMessageListProps = {
  currentUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  messages: ChatMessage[];
  onPostPress: (postId: string, mediaType: "image" | "video" | null) => void;
};

// inverted 리스트라 같은 아이템 안에서 더 오래된 메시지와의 간격(5분)을 비교해 구분선을 그린다.
function shouldShowSeparator(
  olderMessage: ChatMessage | undefined,
  message: ChatMessage,
) {
  if (!olderMessage) {
    return true;
  }

  return (
    new Date(message.created_at).getTime() -
      new Date(olderMessage.created_at).getTime() >
    5 * 60 * 1000
  );
}

export function ChatMessageList({
  currentUserId,
  hasMore,
  isLoadingMore,
  loadMore,
  messages,
  onPostPress,
}: ChatMessageListProps) {
  return (
    <FlatList
      contentContainerStyle={styles.messageList}
      data={messages}
      inverted
      keyExtractor={(message) => message.id}
      ListFooterComponent={
        isLoadingMore ? (
          <Text style={styles.loadMoreText}>이전 메시지 불러오는 중...</Text>
        ) : !hasMore ? (
          <Text style={styles.loadMoreText}>첫 번째 메시지입니다.</Text>
        ) : null
      }
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          loadMore();
        }
      }}
      onEndReachedThreshold={0.3}
      renderItem={({ index, item }) => (
        <View>
          {shouldShowSeparator(messages[index + 1], item) ? (
            <View style={styles.separator}>
              <Text style={styles.separatorText}>
                {formatChatTime(item.created_at)}
              </Text>
            </View>
          ) : null}
          <View style={item.isOptimistic ? styles.optimistic : null}>
            <MessageBubble
              isMine={item.sender_id === currentUserId}
              message={item}
              onPostPress={onPostPress}
            />
          </View>
        </View>
      )}
      style={styles.messages}
    />
  );
}

const styles = StyleSheet.create({
  messages: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  loadMoreText: {
    paddingVertical: 10,
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  optimistic: {
    opacity: 0.6,
  },
  separator: {
    alignItems: "center",
    marginVertical: 12,
  },
  separatorText: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
  },
});
