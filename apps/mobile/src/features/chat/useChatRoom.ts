import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard } from "react-native";

import { blockUser } from "../blocks/api";
import { setActiveConversationId } from "./activeConversation";
import {
  acceptChatRequest,
  markMessagesRead,
  type Message,
  sendMessage,
} from "./api";
import { useConversations, useMessages } from "./hooks";
import { getCurrentUserId } from "../shared/userContext";

export type ChatMessage = Message & {
  isOptimistic?: boolean;
};

// 채팅방 데이터 + 읽음 처리/수락/차단/전송 로직. UI/네비게이션은 화면이 담당.
export function useChatRoom(conversationId: string) {
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      // 이 방을 보고 있는 동안엔 같은 방 메시지 푸시 배너를 띄우지 않게 활성 방으로 표시.
      setActiveConversationId(conversationId);
      void reload();

      return () => {
        setIsFocused(false);
        setActiveConversationId(null);
      };
    }, [conversationId, reload]),
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

  const handleAcceptRequest = useCallback(async () => {
    setIsAccepting(true);

    try {
      await acceptChatRequest(conversationId);
      await reload();
    } finally {
      setIsAccepting(false);
    }
  }, [conversationId, reload]);

  // 차단 성공 시 true 반환(화면 이동은 호출부). 실패 시 false.
  const blockConversationUser = useCallback(async (): Promise<boolean> => {
    if (!conversation || isBlocking) {
      return false;
    }

    try {
      setIsBlocking(true);
      await blockUser(conversation.other_user.id);
      return true;
    } catch {
      setIsBlocking(false);
      return false;
    }
  }, [conversation, isBlocking]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      const tempId = addOptimisticMessage(content, currentUserId);

      try {
        const realMessage = await sendMessage(conversationId, content);
        replaceOptimisticMessage(tempId, realMessage);
      } catch {
        removeOptimisticMessage(tempId);
      }
    },
    [
      addOptimisticMessage,
      conversationId,
      currentUserId,
      removeOptimisticMessage,
      replaceOptimisticMessage,
    ],
  );

  const isPending = conversation?.status === "pending";
  const isIncomingRequest =
    Boolean(conversation) &&
    isPending &&
    conversation?.initiated_by !== currentUserId;

  return {
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
  };
}
