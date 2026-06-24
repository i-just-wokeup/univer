import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MessageBubble } from "../../components/chat/MessageBubble";
import { MessageInput } from "../../components/chat/MessageInput";
import { ScreenHeader } from "../../components/common/ScreenHeader";
import { StateView } from "../../components/common/StateView";
import {
  acceptChatRequest,
  markMessagesRead,
  type Message,
  sendMessage,
} from "../../features/chat/api";
import { useConversations, useMessages } from "../../features/chat/hooks";
import { getCurrentUserId } from "../../features/shared/userContext";
import { colors } from "../../lib/theme";
import { formatChatTime } from "../../lib/utils/time";

type ChatRoomScreenProps = {
  conversationId: string;
};

type ChatMessage = Message & {
  isOptimistic?: boolean;
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

export function ChatRoomScreen({ conversationId }: ChatRoomScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  // 방을 열고 있는 동안 들어온 메시지를 읽음 처리하기 위한 포커스 상태.
  const [isFocused, setIsFocused] = useState(false);
  const { active, pending, reload } = useConversations();
  const {
    addOptimisticMessage,
    broadcastRead,
    error: messagesError,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    messages,
    removeOptimisticMessage,
    replaceOptimisticMessage,
  } = useMessages(conversationId);

  const conversation = useMemo(
    () =>
      [...active, ...pending].find((item) => item.id === conversationId) ??
      null,
    [active, conversationId, pending],
  );

  // inverted FlatList는 index 0을 맨 아래에 그리므로 최신이 0이 되도록 뒤집는다.
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  useEffect(() => {
    void getCurrentUserId()
      .then(setCurrentUserId)
      .catch(() => setCurrentUserId(""));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      void reload();

      return () => {
        setIsFocused(false);
      };
    }, [reload]),
  );

  // 방을 열고 있고 안 읽은 상대 메시지가 있으면 읽음 처리 + 상대에게 읽음 broadcast.
  useEffect(() => {
    if (!isFocused || !currentUserId) {
      return;
    }

    const hasUnreadIncoming = messages.some(
      (message) => message.sender_id !== currentUserId && !message.read_at,
    );

    if (hasUnreadIncoming) {
      void markMessagesRead(conversationId).catch(() => undefined);
      broadcastRead(currentUserId);
    }
  }, [broadcastRead, conversationId, currentUserId, isFocused, messages]);

  async function handleAcceptRequest() {
    setIsAccepting(true);

    try {
      await acceptChatRequest(conversationId);
      await reload();
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleSendMessage(content: string) {
    const tempId = addOptimisticMessage(content, currentUserId);

    try {
      const realMessage = await sendMessage(conversationId, content);
      replaceOptimisticMessage(tempId, realMessage);
    } catch {
      removeOptimisticMessage(tempId);
    }
  }

  const isPending = conversation?.status === "pending";
  const isIncomingRequest =
    Boolean(conversation) &&
    isPending &&
    conversation?.initiated_by !== currentUserId;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ScreenHeader
          onBack={() => router.back()}
          title={conversation?.other_user.nickname ?? "메시지"}
        />

        {isPending ? (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>
              메시지 요청 대기 중입니다. 상대방이 수락하면 대화가 시작됩니다.
            </Text>
            {isIncomingRequest ? (
              <Pressable
                disabled={isAccepting}
                onPress={() => {
                  void handleAcceptRequest();
                }}
                style={({ pressed }) => [
                  styles.acceptButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.acceptText}>
                  {isAccepting ? "수락 중..." : "수락하기"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isLoading ? (
          <StateView
            message="메시지를 불러오는 중입니다."
            title="대화 준비 중"
            type="loading"
          />
        ) : messagesError ? (
          <StateView
            actionLabel="목록으로"
            message={messagesError}
            onAction={() => router.replace("/messages")}
            title="메시지를 불러오지 못했습니다"
            type="error"
          />
        ) : messages.length === 0 ? (
          <StateView
            message="첫 메시지를 보내 대화를 시작하세요."
            title="아직 메시지가 없습니다"
            type="empty"
          />
        ) : (
          <FlatList
            contentContainerStyle={styles.messageList}
            data={reversedMessages}
            inverted
            keyExtractor={(message) => message.id}
            ListFooterComponent={
              isLoadingMore ? (
                <Text style={styles.loadMoreText}>
                  이전 메시지 불러오는 중...
                </Text>
              ) : !hasMore ? (
                <Text style={styles.loadMoreText}>첫 번째 메시지입니다.</Text>
              ) : null
            }
            onEndReached={() => {
              if (hasMore && !isLoadingMore) {
                void loadMore();
              }
            }}
            onEndReachedThreshold={0.3}
            style={styles.messages}
            renderItem={({ index, item }) => (
              <View>
                {shouldShowSeparator(reversedMessages[index + 1], item) ? (
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
                  />
                </View>
              </View>
            )}
          />
        )}

        <View style={[styles.inputWrap, { paddingBottom: insets.bottom }]}>
          <MessageInput
            disabled={Boolean(messagesError)}
            onSend={handleSendMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  keyboard: {
    flex: 1,
  },
  messages: {
    flex: 1,
  },
  inputWrap: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  pendingBox: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(124,58,237,0.16)",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pendingText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  acceptButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 13,
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  acceptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
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
  pressed: {
    opacity: 0.75,
  },
});
