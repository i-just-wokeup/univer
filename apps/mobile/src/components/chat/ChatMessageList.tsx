import { memo, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type FlatListProps,
  type ListRenderItemInfo,
} from "react-native";

import { type ChatMessage } from "../../features/chat/useChatRoom";
import { colors } from "../../lib/theme";
import { formatChatTime } from "../../lib/utils/time";
import { MessageBubble } from "./MessageBubble";

type ChatMessageListProps = {
  contentTopInset?: number;
  currentUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  messages: ChatMessage[];
  onPostPress: (postId: string, mediaType: "image" | "video" | null) => void;
  renderScrollComponent?: FlatListProps<ChatMessage>["renderScrollComponent"];
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

type ChatMessageItemProps = {
  currentUserId: string;
  isOptimistic: boolean;
  message: ChatMessage;
  olderMessage: ChatMessage | undefined;
  onPostPress: (postId: string, mediaType: "image" | "video" | null) => void;
};

function ChatMessageItemComponent({
  currentUserId,
  isOptimistic,
  message,
  olderMessage,
  onPostPress,
}: ChatMessageItemProps) {
  return (
    <View>
      {shouldShowSeparator(olderMessage, message) ? (
        <View style={styles.separator}>
          <Text style={styles.separatorText}>
            {formatChatTime(message.created_at)}
          </Text>
        </View>
      ) : null}
      <View style={isOptimistic ? styles.optimistic : null}>
        <MessageBubble
          isMine={message.sender_id === currentUserId}
          message={message}
          onPostPress={onPostPress}
        />
      </View>
    </View>
  );
}

const ChatMessageItem = memo(ChatMessageItemComponent);

export function ChatMessageList({
  contentTopInset = 10,
  currentUserId,
  hasMore,
  isLoadingMore,
  loadMore,
  messages,
  onPostPress,
  renderScrollComponent,
}: ChatMessageListProps) {
  const keyExtractor = useCallback((message: ChatMessage) => message.id, []);
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const renderItem = useCallback(
    ({ index, item }: ListRenderItemInfo<ChatMessage>) => (
      <ChatMessageItem
        currentUserId={currentUserId}
        isOptimistic={item.isOptimistic === true}
        message={item}
        olderMessage={messages[index + 1]}
        onPostPress={onPostPress}
      />
    ),
    [currentUserId, messages, onPostPress],
  );

  return (
    <FlatList
      contentContainerStyle={[
        styles.messageList,
        { paddingTop: contentTopInset },
      ]}
      data={messages}
      initialNumToRender={16}
      inverted
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      ListFooterComponent={
        isLoadingMore ? (
          <Text style={styles.loadMoreText}>이전 메시지 불러오는 중...</Text>
        ) : !hasMore ? (
          <Text style={styles.loadMoreText}>첫 번째 메시지입니다.</Text>
        ) : null
      }
      maxToRenderPerBatch={10}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      removeClippedSubviews
      renderItem={renderItem}
      renderScrollComponent={renderScrollComponent}
      style={styles.messages}
      windowSize={9}
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
