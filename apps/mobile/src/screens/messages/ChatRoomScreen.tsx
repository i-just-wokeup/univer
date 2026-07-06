import { useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionSheet } from "../../components/common/ActionSheet";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { ChatRoomHeader } from "../../components/chat/ChatRoomHeader";
import { MessageBubble } from "../../components/chat/MessageBubble";
import { MessageInput } from "../../components/chat/MessageInput";
import { StateView } from "../../components/common/StateView";
import { type ChatMessage, useChatRoom } from "../../features/chat/useChatRoom";
import { useStableInsets } from "../../lib/useStableInsets";
import { colors } from "../../lib/theme";
import { formatChatTime } from "../../lib/utils/time";

type ChatRoomScreenProps = {
  conversationId: string;
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
  const insets = useStableInsets();
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    blockConversationUser,
    conversation,
    currentUserId,
    handleAcceptRequest,
    handleSendMessage,
    hasMore,
    isAccepting,
    isBlocking,
    isIncomingRequest,
    isKeyboardVisible,
    isLoading,
    isLoadingMore,
    isPending,
    loadMore,
    messages,
    messagesError,
    reversedMessages,
  } = useChatRoom(conversationId);

  async function handleBlockUser() {
    const blocked = await blockConversationUser();
    if (blocked) {
      router.replace("/messages");
    } else {
      setIsBlockConfirmOpen(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ChatRoomHeader
          avatarUrl={conversation?.other_user.avatar_url ?? null}
          nickname={conversation?.other_user.nickname ?? "메시지"}
          onBack={() => router.back()}
          onPressProfile={
            conversation
              ? (nickname) =>
                  router.push({
                    pathname: "/profile/[nickname]",
                    params: { nickname },
                  })
              : undefined
          }
          right={
            conversation ? (
              <Pressable
                accessibilityLabel="더보기"
                accessibilityRole="button"
                onPress={() => setIsMenuOpen(true)}
                style={({ pressed }) => [
                  styles.headerMenuButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <MoreHorizontal
                  color={colors.muted}
                  size={22}
                  strokeWidth={2.5}
                />
              </Pressable>
            ) : null
          }
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
                    onPostPress={(postId, mediaType) =>
                      mediaType === "video"
                        ? router.push({
                            pathname: "/reels",
                            params: { postId },
                          })
                        : router.push({
                            pathname: "/post/[id]",
                            params: { id: postId },
                          })
                    }
                  />
                </View>
              </View>
            )}
          />
        )}

        <View
          style={[
            styles.inputWrap,
            { paddingBottom: isKeyboardVisible ? 0 : insets.bottom },
          ]}
        >
          <MessageInput
            disabled={Boolean(messagesError)}
            onSend={handleSendMessage}
          />
        </View>
      </KeyboardAvoidingView>

      <ActionSheet
        isOpen={isMenuOpen}
        items={[
          {
            danger: true,
            label: "차단하기",
            onPress: () => setIsBlockConfirmOpen(true),
          },
          {
            label: "취소",
            onPress: () => setIsMenuOpen(false),
          },
        ]}
        onClose={() => setIsMenuOpen(false)}
      />

      <ConfirmDialog
        confirmLabel={isBlocking ? "차단 중..." : "차단"}
        danger
        description="차단하면 서로의 게시물과 채팅이 숨겨집니다."
        isOpen={isBlockConfirmOpen}
        onCancel={() => setIsBlockConfirmOpen(false)}
        onConfirm={() => {
          void handleBlockUser();
        }}
        title={`${conversation?.other_user.nickname ?? ""}을(를) 차단할까요?`}
      />
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
  headerMenuButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.white,
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
