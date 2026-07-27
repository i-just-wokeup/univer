import { useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ChatMessageList } from "../../components/chat/ChatMessageList";
import { ChatRequestBanner } from "../../components/chat/ChatRequestBanner";
import { ChatRoomMoreMenu } from "../../components/chat/ChatRoomMoreMenu";
import { ChatRoomHeader } from "../../components/chat/ChatRoomHeader";
import { MessageInput } from "../../components/chat/MessageInput";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { StateView } from "../../components/common/StateView";
import { useChatRoom } from "../../features/chat/useChatRoom";
import { useStableInsets } from "../../lib/useStableInsets";
import { colors } from "../../lib/theme";

type ChatRoomScreenProps = {
  conversationId: string;
};

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

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handlePressProfile = useCallback(
    (nickname: string) => {
      router.push({
        pathname: "/profile/[nickname]",
        params: { nickname },
      });
    },
    [router],
  );

  const handleOpenMenu = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleOpenBlockConfirm = useCallback(() => {
    setIsBlockConfirmOpen(true);
  }, []);

  const handleCloseBlockConfirm = useCallback(() => {
    setIsBlockConfirmOpen(false);
  }, []);

  const handleAcceptPress = useCallback(() => {
    void handleAcceptRequest();
  }, [handleAcceptRequest]);

  const handleLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  const handlePostPress = useCallback(
    (postId: string, mediaType: "image" | "video" | null) => {
      if (mediaType === "video") {
        router.push({
          pathname: "/reels",
          params: { postId },
        });
        return;
      }

      router.push({
        pathname: "/post/[id]",
        params: { id: postId },
      });
    },
    [router],
  );

  const handleBlockUser = useCallback(async () => {
    const blocked = await blockConversationUser();
    if (blocked) {
      router.replace("/messages");
    } else {
      setIsBlockConfirmOpen(false);
    }
  }, [blockConversationUser, router]);

  const handleConfirmBlock = useCallback(() => {
    void handleBlockUser();
  }, [handleBlockUser]);

  return (
    <ScreenContainer reserveBottomInset={false} style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ChatRoomHeader
          avatarUrl={conversation?.other_user.avatar_url ?? null}
          nickname={conversation?.other_user.nickname ?? "메시지"}
          onBack={handleBack}
          onPressProfile={conversation ? handlePressProfile : undefined}
          right={
            conversation ? (
              <Pressable
                accessibilityLabel="더보기"
                accessibilityRole="button"
                onPress={handleOpenMenu}
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
          <ChatRequestBanner
            isAccepting={isAccepting}
            isIncomingRequest={isIncomingRequest}
            onAccept={handleAcceptPress}
          />
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
          <ChatMessageList
            currentUserId={currentUserId}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMore={handleLoadMore}
            messages={reversedMessages}
            onPostPress={handlePostPress}
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

      <ChatRoomMoreMenu
        isBlocking={isBlocking}
        isBlockConfirmOpen={isBlockConfirmOpen}
        isMenuOpen={isMenuOpen}
        nickname={conversation?.other_user.nickname ?? ""}
        onBlock={handleConfirmBlock}
        onCloseBlockConfirm={handleCloseBlockConfirm}
        onCloseMenu={handleCloseMenu}
        onOpenBlockConfirm={handleOpenBlockConfirm}
      />
    </ScreenContainer>
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
  pressed: {
    opacity: 0.75,
  },
});
