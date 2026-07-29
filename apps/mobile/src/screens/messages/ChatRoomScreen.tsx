import { useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import {
  forwardRef,
  useCallback,
  useState,
  type ComponentRef,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ScrollViewProps,
} from "react-native";
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
  KeyboardStickyView,
  type KeyboardChatScrollViewProps,
} from "react-native-keyboard-controller";
import { useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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

const CHAT_INPUT_ID = "chat-input";
const CHAT_COMPOSER_HEIGHT = 56;
const CHAT_TEXT_INPUT_HEIGHT = 38;
const CHAT_LIST_MARGIN = 8;

type ChatRoomScreenProps = {
  conversationId: string;
};

const ChatScrollView = forwardRef<
  ComponentRef<typeof KeyboardChatScrollView>,
  ScrollViewProps & KeyboardChatScrollViewProps
>(function ChatScrollView(props, ref) {
  const insets = useStableInsets();

  return (
    <KeyboardChatScrollView
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      offset={insets.bottom - CHAT_LIST_MARGIN}
      {...props}
    />
  );
});

export function ChatRoomScreen({ conversationId }: ChatRoomScreenProps) {
  const router = useRouter();
  const insets = useStableInsets();
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const extraContentPadding = useSharedValue(0);
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
    isLoading,
    isLoadingMore,
    isPending,
    loadMore,
    messages,
    messagesError,
    reversedMessages,
  } = useChatRoom(conversationId);

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView
        {...(props as ScrollViewProps & KeyboardChatScrollViewProps)}
        extraContentPadding={extraContentPadding}
      />
    ),
    [extraContentPadding],
  );

  const handleInputLayout = useCallback(
    (event: LayoutChangeEvent) => {
      extraContentPadding.value = withTiming(
        Math.max(event.nativeEvent.layout.height - CHAT_TEXT_INPUT_HEIGHT, 0),
        { duration: 250 },
      );
    },
    [extraContentPadding],
  );

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
    <ScreenContainer style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.headerArea}>
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
        </View>

        <SafeAreaView edges={["bottom"]} style={styles.keyboardArea}>
          <KeyboardGestureArea
            interpolator="ios"
            offset={CHAT_COMPOSER_HEIGHT}
            style={styles.gestureArea}
            textInputNativeID={CHAT_INPUT_ID}
          >
            {isLoading ? (
              <View style={styles.stateArea}>
                <StateView
                  message="메시지를 불러오는 중입니다."
                  title="대화 준비 중"
                  type="loading"
                />
              </View>
            ) : messagesError ? (
              <View style={styles.stateArea}>
                <StateView
                  actionLabel="목록으로"
                  message={messagesError}
                  onAction={() => router.replace("/messages")}
                  title="메시지를 불러오지 못했습니다"
                  type="error"
                />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.stateArea}>
                <StateView
                  message="첫 메시지를 보내 대화를 시작하세요."
                  title="아직 메시지가 없습니다"
                  type="empty"
                />
              </View>
            ) : (
              <ChatMessageList
                contentTopInset={CHAT_COMPOSER_HEIGHT + CHAT_LIST_MARGIN}
                currentUserId={currentUserId}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadMore={handleLoadMore}
                messages={reversedMessages}
                onPostPress={handlePostPress}
                renderScrollComponent={renderScrollComponent}
              />
            )}

            <KeyboardStickyView
              offset={{ opened: insets.bottom - CHAT_LIST_MARGIN }}
              style={styles.inputSticky}
            >
              <View style={styles.inputWrap}>
                <MessageInput
                  disabled={Boolean(messagesError)}
                  inputNativeID={CHAT_INPUT_ID}
                  onInputLayout={handleInputLayout}
                  onSend={handleSendMessage}
                />
              </View>
            </KeyboardStickyView>
          </KeyboardGestureArea>
        </SafeAreaView>
      </View>

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
  content: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerArea: {
    backgroundColor: colors.accentSoft,
  },
  keyboardArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  gestureArea: {
    flex: 1,
  },
  stateArea: {
    flex: 1,
    backgroundColor: colors.accentSoft,
  },
  inputSticky: {
    backgroundColor: colors.white,
  },
  inputWrap: {
    backgroundColor: colors.white,
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
